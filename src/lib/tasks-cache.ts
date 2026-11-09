import type { Database } from '$lib/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];

function openDatabase(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open('expense-tracker-task-cache', 2);
		request.onupgradeneeded = () => {
			if (!request.result.objectStoreNames.contains('tasks')) request.result.createObjectStore('tasks');
			if (!request.result.objectStoreNames.contains('pending')) request.result.createObjectStore('pending');
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export async function readPendingTasks(project: string, userId: string): Promise<Task[]> {
	const db = await openDatabase();
	try {
		return await new Promise((resolve, reject) => {
			const request = db.transaction('pending').objectStore('pending').get(key(project, userId));
			request.onsuccess = () => resolve((request.result as Task[] | undefined) ?? []);
			request.onerror = () => reject(request.error);
		});
	} finally {
		db.close();
	}
}

export async function addPendingTask(project: string, userId: string, task: Task): Promise<void> {
	const db = await openDatabase();
	try {
		await new Promise<void>((resolve, reject) => {
			const transaction = db.transaction('pending', 'readwrite');
			const store = transaction.objectStore('pending');
			const request = store.get(key(project, userId));
			request.onsuccess = () => store.put([...(request.result ?? []), task], key(project, userId));
			transaction.oncomplete = () => resolve();
			transaction.onerror = () => reject(transaction.error);
			transaction.onabort = () => reject(transaction.error);
		});
	} finally {
		db.close();
	}
}

// Remove only the acknowledged task, and update the offline snapshot atomically.
export async function acknowledgePendingTask(project: string, userId: string, task: Task): Promise<void> {
	const db = await openDatabase();
	try {
		await new Promise<void>((resolve, reject) => {
			const transaction = db.transaction(['pending', 'tasks'], 'readwrite');
			const pending = transaction.objectStore('pending');
			const cached = transaction.objectStore('tasks');
			const cacheKey = key(project, userId);
			const pendingRequest = pending.get(cacheKey);
			pendingRequest.onsuccess = () => {
				const list = (pendingRequest.result ?? []) as Task[];
				pending.put(list.filter((item) => item.id !== task.id), cacheKey);
			};
			const cacheRequest = cached.get(cacheKey);
			cacheRequest.onsuccess = () => {
				const list = (cacheRequest.result ?? []) as Task[];
				cached.put([task, ...list.filter((item) => item.id !== task.id)], cacheKey);
			};
			transaction.oncomplete = () => resolve();
			transaction.onerror = () => reject(transaction.error);
			transaction.onabort = () => reject(transaction.error);
		});
	} finally {
		db.close();
	}
}

function key(project: string, userId: string) {
	return JSON.stringify([project, userId]);
}

export async function readCachedTasks(project: string, userId: string): Promise<Task[] | undefined> {
	const db = await openDatabase();
	try {
		return await new Promise((resolve, reject) => {
			const request = db.transaction('tasks').objectStore('tasks').get(key(project, userId));
			request.onsuccess = () => resolve(request.result as Task[] | undefined);
			request.onerror = () => reject(request.error);
		});
	} finally {
		db.close();
	}
}

export async function cacheTasks(project: string, userId: string, tasks: Task[]): Promise<void> {
	const db = await openDatabase();
	try {
		await new Promise<void>((resolve, reject) => {
			const transaction = db.transaction('tasks', 'readwrite');
			transaction.objectStore('tasks').put(tasks, key(project, userId));
			transaction.oncomplete = () => resolve();
			transaction.onerror = () => reject(transaction.error);
			transaction.onabort = () => reject(transaction.error);
		});
	} finally {
		db.close();
	}
}
