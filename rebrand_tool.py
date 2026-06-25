import os
import tkinter as tk
from tkinter import messagebox, ttk, filedialog

def replace_in_files(project_dir, replacements):
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

class RebrandApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Advanced Rebrander Tool")
        self.root.geometry("750x650")
        self.root.configure(padx=20, pady=20)
        
        # Header
        tk.Label(self.root, text="Ultimate Media Downloader - Advanced Rebranding Tool", font=("Helvetica", 16, "bold")).pack(pady=(0, 20))
        
        # Path Selection Frame
        path_frame = ttk.Frame(self.root)
        path_frame.pack(fill=tk.X, pady=(0, 20))
        
        ttk.Label(path_frame, text="Project Path:").pack(side=tk.LEFT, padx=(0, 10))
        self.path_entry = ttk.Entry(path_frame)
        self.path_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))
        self.path_entry.insert(0, os.path.dirname(os.path.abspath(__file__)))
        ttk.Button(path_frame, text="Browse...", command=self.browse_path).pack(side=tk.LEFT)
        
        # Scrollable Frame for Replacements
        canvas = tk.Canvas(self.root, highlightthickness=0)
        scrollbar = ttk.Scrollbar(self.root, orient="vertical", command=canvas.yview)
        self.scrollable_frame = ttk.Frame(canvas)
        
        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side=tk.TOP, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Grid Headers
        ttk.Label(self.scrollable_frame, text="Label", font=("Helvetica", 10, "bold")).grid(row=0, column=0, padx=5, pady=5, sticky="w")
        ttk.Label(self.scrollable_frame, text="Old Value (To Replace)", font=("Helvetica", 10, "bold")).grid(row=0, column=1, padx=5, pady=5)
        ttk.Label(self.scrollable_frame, text="New Value", font=("Helvetica", 10, "bold")).grid(row=0, column=2, padx=5, pady=5)
        
        self.row_count = 1
        self.entries = []
        
        # Default Fields
        self.add_row("App Name:", "Ultimate Media Downloader", "")
        self.add_row("Description:", "A modern, high-performance web application that allows you to easily download media", "")
        self.add_row("Github URL:", "https://github.com/Subhan-Haider/Media-Downloader", "")
        self.add_row("Author Name:", "Subhan-Haider", "")
        
        # Buttons Frame
        btn_frame = ttk.Frame(self.root)
        btn_frame.pack(fill=tk.X, pady=20)
        
        ttk.Button(btn_frame, text="+ Add Custom Row", command=lambda: self.add_row("Custom:", "", "")).pack(side=tk.LEFT, padx=5)
        ttk.Button(btn_frame, text="Start Rebranding", command=self.on_rebrand, style="Accent.TButton").pack(side=tk.RIGHT, padx=5)
        
        tk.Label(self.root, text="Note: This will scan all .ts, .tsx, .json, and .md files in the project.\nRestart the Next.js server after rebranding.", justify=tk.CENTER, fg="gray").pack()

    def browse_path(self):
        folder_selected = filedialog.askdirectory(initialdir=self.path_entry.get())
        if folder_selected:
            self.path_entry.delete(0, tk.END)
            self.path_entry.insert(0, folder_selected)

    def add_row(self, label_text, default_old, default_new):
        ttk.Label(self.scrollable_frame, text=label_text).grid(row=self.row_count, column=0, sticky="e", padx=5, pady=5)
        
        old_entry = ttk.Entry(self.scrollable_frame, width=35)
        old_entry.insert(0, default_old)
        old_entry.grid(row=self.row_count, column=1, padx=5, pady=5)
        
        new_entry = ttk.Entry(self.scrollable_frame, width=35)
        new_entry.insert(0, default_new)
        new_entry.grid(row=self.row_count, column=2, padx=5, pady=5)
        
        self.entries.append((old_entry, new_entry))
        self.row_count += 1

    def on_rebrand(self):
        project_dir = self.path_entry.get().strip()
        if not os.path.exists(project_dir):
            messagebox.showerror("Error", "The specified Project Path does not exist.")
            return
            
        replacements = []
        for old_e, new_e in self.entries:
            o = old_e.get()
            n = new_e.get()
            if o.strip() and n.strip():
                replacements.append((o, n))
        
        if not replacements:
            messagebox.showwarning("Warning", "Please fill in at least one Old and New value pair.")
            return
            
        confirm = messagebox.askyesno("Confirm", f"Are you sure you want to search and replace these values in:\n{project_dir}\n\nThis action cannot be undone.")
        if confirm:
            count = replace_in_files(project_dir, replacements)
            messagebox.showinfo("Success", f"Rebranding complete!\nModified {count} files.")

if __name__ == "__main__":
    root = tk.Tk()
    
    # Optional: Basic styling to make the primary button pop
    style = ttk.Style(root)
    style.configure("Accent.TButton", font=("Helvetica", 10, "bold"))
    
    app = RebrandApp(root)
    root.mainloop()
