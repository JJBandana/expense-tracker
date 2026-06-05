import os
import glob
import re

for file_path in glob.glob("src/routes/**/*.svelte", recursive=True):
    with open(file_path, "r") as f:
        content = f.read()

    # Replace data.supabase. with data.supabase!.
    new_content = content.replace("data.supabase.", "data.supabase!.")
    # Also replace data.supabase\n with data.supabase!\n (in method chaining)
    new_content = re.sub(r'data\.supabase\s*\n\s*\.', 'data.supabase!\n\t\t\t.', new_content)

    if new_content != content:
        print(f"Fixed {file_path}")
        with open(file_path, "w") as f:
            f.write(new_content)

