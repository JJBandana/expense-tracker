import os
import glob
import re

for file_path in glob.glob("src/routes/**/*.server.ts", recursive=True):
    print(f"Processing {file_path}")
    with open(file_path, "r") as f:
        content = f.read()

    # Change PageServerLoad to PageLoad
    content = content.replace("PageServerLoad", "PageLoad")
    
    # Change async ({ locals: { supabase, user } }) to async ({ parent }) => { const { supabase, user } = await parent();
    
    # It might be locals: { supabase }
    
    def replacer(match):
        args = match.group(1)
        # Check if locals is used
        if "locals" in args:
            # Check what's extracted
            inner = re.search(r"locals:\s*\{\s*(.*?)\s*\}", args)
            extracted = inner.group(1) if inner else "supabase, user"
            new_args = args.replace(match.group(0).split("=>")[0].split("(")[1].split(")")[0], "parent, params")
            # we can just use "parent, params" if params is there
            has_params = "params" in args
            has_url = "url" in args
            
            p_args = ["parent"]
            if has_params: p_args.append("params")
            if has_url: p_args.append("url")
            
            return f"async ({{ {', '.join(p_args)} }}) => {{\n\tconst {{ {extracted} }} = await parent();"
        return match.group(0)

    content = re.sub(r"async\s*\(\{\s*(.*?)\s*\}\)\s*=>\s*\{", replacer, content)

    # Remove export const actions block
    content = re.sub(r"export\s+const\s+actions\s*:\s*Actions\s*=\s*\{.*?\n\};", "", content, flags=re.DOTALL)
    
    # Write back to +page.ts
    new_path = file_path.replace(".server.ts", ".ts")
    with open(new_path, "w") as f:
        f.write(content)
        
    os.remove(file_path)

print("Done")
