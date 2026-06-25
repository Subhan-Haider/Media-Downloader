import os
import shutil
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

def replace_assets(project_dir, logo_path, favicon_path):
    assets_replaced = 0
    if logo_path and os.path.exists(logo_path):
        target = os.path.join(project_dir, "public", "logo.png")
        if os.path.exists(os.path.dirname(target)):
            shutil.copy(logo_path, target)
            assets_replaced += 1
            
    if favicon_path and os.path.exists(favicon_path):
        target = os.path.join(project_dir, "src", "app", "icon.png")
        if os.path.exists(os.path.dirname(target)):
            shutil.copy(favicon_path, target)
            assets_replaced += 1
            
    return assets_replaced

class RebrandApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Advanced Rebrander Tool")
        self.root.geometry("750x700")
        self.root.configure(padx=20, pady=20)
        
        # Header
        tk.Label(self.root, text="Ultimate Media Downloader - Advanced Rebranding Tool", font=("Helvetica", 16, "bold")).pack(pady=(0, 20))
        
        # Path Selection Frame
        path_frame = ttk.Frame(self.root)
        path_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(path_frame, text="Project Path:").pack(side=tk.LEFT, padx=(0, 10))
        self.path_entry = ttk.Entry(path_frame)
        self.path_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))
        self.path_entry.insert(0, os.path.dirname(os.path.abspath(__file__)))
        ttk.Button(path_frame, text="Browse...", command=self.browse_path).pack(side=tk.LEFT)
        
        # Assets Frame
        asset_frame = ttk.LabelFrame(self.root, text="Replace Assets (Optional)", padding=10)
        asset_frame.pack(fill=tk.X, pady=(0, 20))
        
        ttk.Label(asset_frame, text="New Logo Image (PNG):").grid(row=0, column=0, sticky="e", padx=5, pady=5)
        self.logo_entry = ttk.Entry(asset_frame, width=40)
        self.logo_entry.grid(row=0, column=1, padx=5, pady=5)
        ttk.Button(asset_frame, text="Browse Image", command=lambda: self.browse_file(self.logo_entry)).grid(row=0, column=2, padx=5, pady=5)
        
        ttk.Label(asset_frame, text="New App Icon/Favicon (PNG):").grid(row=1, column=0, sticky="e", padx=5, pady=5)
        self.favicon_entry = ttk.Entry(asset_frame, width=40)
        self.favicon_entry.grid(row=1, column=1, padx=5, pady=5)
        ttk.Button(asset_frame, text="Browse Image", command=lambda: self.browse_file(self.favicon_entry)).grid(row=1, column=2, padx=5, pady=5)

        # Scrollable Frame for Text Replacements
        text_frame = ttk.LabelFrame(self.root, text="Text Replacements", padding=10)
        text_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        
        canvas = tk.Canvas(text_frame, highlightthickness=0)
        scrollbar = ttk.Scrollbar(text_frame, orient="vertical", command=canvas.yview)
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
        btn_frame.pack(fill=tk.X, pady=10)
        
        ttk.Button(btn_frame, text="+ Add Custom Row", command=lambda: self.add_row("Custom:", "", "")).pack(side=tk.LEFT, padx=5)
        ttk.Button(btn_frame, text="Start Rebranding", command=self.on_rebrand, style="Accent.TButton").pack(side=tk.RIGHT, padx=5)
        
        tk.Label(self.root, text="Note: This will scan all text files and replace images globally.\nRestart the Next.js server after rebranding.", justify=tk.CENTER, fg="gray").pack()

    def browse_path(self):
        folder_selected = filedialog.askdirectory(initialdir=self.path_entry.get())
        if folder_selected:
            self.path_entry.delete(0, tk.END)
            self.path_entry.insert(0, folder_selected)
            
    def browse_file(self, entry_widget):
        file_selected = filedialog.askopenfilename(filetypes=[("Image Files", "*.png;*.ico;*.jpg;*.jpeg")])
        if file_selected:
            entry_widget.delete(0, tk.END)
            entry_widget.insert(0, file_selected)

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
                
        logo_val = self.logo_entry.get().strip()
        favicon_val = self.favicon_entry.get().strip()
        
        if not replacements and not logo_val and not favicon_val:
            messagebox.showwarning("Warning", "Please fill in at least one text replacement or select an image asset to replace.")
            return
            
        confirm = messagebox.askyesno("Confirm", f"Are you sure you want to search and replace these values and assets in:\n{project_dir}\n\nThis action cannot be undone.")
        if confirm:
            text_count = replace_in_files(project_dir, replacements) if replacements else 0
            asset_count = replace_assets(project_dir, logo_val, favicon_val)
            messagebox.showinfo("Success", f"Rebranding complete!\nModified {text_count} text files.\nReplaced {asset_count} image assets.")

if __name__ == "__main__":
    root = tk.Tk()
    style = ttk.Style(root)
    style.configure("Accent.TButton", font=("Helvetica", 10, "bold"))
    app = RebrandApp(root)
    root.mainloop()
