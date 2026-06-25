import os
import tkinter as tk
from tkinter import messagebox, ttk

def replace_in_files(replacements):
    project_dir = os.path.dirname(os.path.abspath(__file__))
    ignore_dirs = {'.git', '.next', 'node_modules', 'data', 'public', '.yarn'}
    allowed_exts = {'.ts', '.tsx', '.json', '.md', '.html', '.css', '.js', '.py'}
    
    files_modified = 0
    
    for root, dirs, files in os.walk(project_dir):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        
        for file in files:
            ext = os.path.splitext(file)[1]
            # Don't replace inside this script itself
            if ext in allowed_exts and file != "rebrand_tool.py":
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content = content
                    for old_text, new_text in replacements:
                        if old_text.strip() and new_text.strip():
                            new_content = new_content.replace(old_text, new_text)
                            
                    if new_content != content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        files_modified += 1
                except Exception as e:
                    print(f"Failed to process {filepath}: {e}")
                    
    return files_modified

def on_rebrand():
    replacements = [
        (entry_old_name.get(), entry_new_name.get()),
        (entry_old_desc.get(), entry_new_desc.get()),
        (entry_old_repo.get(), entry_new_repo.get()),
        (entry_old_author.get(), entry_new_author.get())
    ]
    
    # Filter out empty pairs
    valid_replacements = [(o, n) for o, n in replacements if o.strip() and n.strip()]
    
    if not valid_replacements:
        messagebox.showwarning("Warning", "Please fill in at least one Old and New value pair.")
        return
        
    confirm = messagebox.askyesno("Confirm", "Are you sure you want to search and replace these values across the entire project?\nThis action cannot be undone.")
    if confirm:
        count = replace_in_files(valid_replacements)
        messagebox.showinfo("Success", f"Rebranding complete!\nModified {count} files.")

# Setup the UI
root = tk.Tk()
root.title("App Rebrander Tool")
root.geometry("600x450")
root.configure(padx=20, pady=20)

tk.Label(root, text="Ultimate Media Downloader - Rebranding Tool", font=("Helvetica", 16, "bold")).pack(pady=(0, 20))

frame = ttk.Frame(root)
frame.pack(fill=tk.BOTH, expand=True)

# Grid setup
ttk.Label(frame, text="Old Value (To Replace)", font=("Helvetica", 10, "bold")).grid(row=0, column=1, padx=5, pady=5)
ttk.Label(frame, text="New Value", font=("Helvetica", 10, "bold")).grid(row=0, column=2, padx=5, pady=5)

# 1. App Name
ttk.Label(frame, text="App Name:").grid(row=1, column=0, sticky="e", padx=5, pady=5)
entry_old_name = ttk.Entry(frame, width=30)
entry_old_name.insert(0, "Ultimate Media Downloader")
entry_old_name.grid(row=1, column=1, padx=5, pady=5)
entry_new_name = ttk.Entry(frame, width=30)
entry_new_name.grid(row=1, column=2, padx=5, pady=5)

# 2. Description
ttk.Label(frame, text="Description:").grid(row=2, column=0, sticky="e", padx=5, pady=5)
entry_old_desc = ttk.Entry(frame, width=30)
entry_old_desc.insert(0, "A modern, high-performance web application that allows you to easily download media")
entry_old_desc.grid(row=2, column=1, padx=5, pady=5)
entry_new_desc = ttk.Entry(frame, width=30)
entry_new_desc.grid(row=2, column=2, padx=5, pady=5)

# 3. Github / URL
ttk.Label(frame, text="Github URL:").grid(row=3, column=0, sticky="e", padx=5, pady=5)
entry_old_repo = ttk.Entry(frame, width=30)
entry_old_repo.insert(0, "https://github.com/Subhan-Haider/Media-Downloader")
entry_old_repo.grid(row=3, column=1, padx=5, pady=5)
entry_new_repo = ttk.Entry(frame, width=30)
entry_new_repo.grid(row=3, column=2, padx=5, pady=5)

# 4. Author
ttk.Label(frame, text="Author Name:").grid(row=4, column=0, sticky="e", padx=5, pady=5)
entry_old_author = ttk.Entry(frame, width=30)
entry_old_author.insert(0, "Subhan-Haider")
entry_old_author.grid(row=4, column=1, padx=5, pady=5)
entry_new_author = ttk.Entry(frame, width=30)
entry_new_author.grid(row=4, column=2, padx=5, pady=5)

ttk.Button(root, text="Start Rebranding", command=on_rebrand, width=25).pack(pady=20)

tk.Label(root, text="Note: This will scan all .ts, .tsx, .json, and .md files in the project.\nRestart the Next.js server after rebranding.", justify=tk.CENTER, fg="gray").pack()

root.mainloop()
