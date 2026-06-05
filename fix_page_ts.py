import os
import glob
import re

for file_path in glob.glob("src/routes/**/*.ts", recursive=True):
    with open(file_path, "r") as f:
        content = f.read()

    # Remove Actions import
    new_content = re.sub(r'Actions,\s*', '', content)
    new_content = re.sub(r',\s*Actions', '', new_content)
    new_content = re.sub(r'import type \{ Actions \} from \'\./\$types\';\n?', '', new_content)

    # Change supabase. to supabase!.
    # But ONLY in the body, or we can just replace supabase. with supabase!. globally, except in types
    # Actually, the error is `supabase is possibly null`.
    new_content = new_content.replace('supabase.', 'supabase!.')
    new_content = re.sub(r'supabase\s*\n\s*\.', 'supabase!\n\t\t\t.', new_content)

    if new_content != content:
        print(f"Fixed {file_path}")
        with open(file_path, "w") as f:
            f.write(new_content)

