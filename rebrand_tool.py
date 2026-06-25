import os
import shutil
import customtkinter as ctk
from tkinter import filedialog, messagebox
try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

ctk.set_appearance_mode("System")  # Modes: "System" (standard), "Dark", "Light"
ctk.set_default_color_theme("blue")  # Themes: "blue" (standard), "green", "dark-blue"

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
    
    def process_image(src, dst):
        if os.path.exists(os.path.dirname(dst)):
            if HAS_PIL:
                try:
                    with Image.open(src) as img:
                        # Convert to RGBA if it has transparency, else RGB
                        if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                            img = img.convert("RGBA")
                        else:
                            img = img.convert("RGB")
                        img.save(dst, format="PNG")
                    return True
                except Exception as e:
                    print(f"Pillow failed to process {src}: {e}")
                    return False
            else:
                shutil.copy(src, dst)
                return True
        return False

    if logo_path and os.path.exists(logo_path):
        target = os.path.join(project_dir, "public", "logo.png")
        if process_image(logo_path, target):
            assets_replaced += 1
            
    if favicon_path and os.path.exists(favicon_path):
        target = os.path.join(project_dir, "src", "app", "icon.png")
        if process_image(favicon_path, target):
            assets_replaced += 1
            
    return assets_replaced

class RebrandApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        
        self.title("Ultimate Media Downloader - Rebrander")
        self.geometry("950x850")
        self.minsize(800, 750)
        
        # Configure grid layout
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(2, weight=1)
        
        # Header
        self.header_label = ctk.CTkLabel(self, text="Advanced Rebranding Tool", font=ctk.CTkFont(size=24, weight="bold"))
        self.header_label.grid(row=0, column=0, padx=20, pady=(20, 10))
        
        # Project Path
        self.path_frame = ctk.CTkFrame(self)
        self.path_frame.grid(row=1, column=0, padx=20, pady=(10, 10), sticky="ew")
        self.path_frame.grid_columnconfigure(1, weight=1)
        
        self.path_label = ctk.CTkLabel(self.path_frame, text="Project Path:")
        self.path_label.grid(row=0, column=0, padx=10, pady=10)
        
        self.path_entry = ctk.CTkEntry(self.path_frame)
        self.path_entry.grid(row=0, column=1, padx=(0, 10), pady=10, sticky="ew")
        self.path_entry.insert(0, os.path.dirname(os.path.abspath(__file__)))
        
        self.browse_btn = ctk.CTkButton(self.path_frame, text="Browse...", command=self.browse_path, width=100)
        self.browse_btn.grid(row=0, column=2, padx=(0, 10), pady=10)
        
        # Scrollable Main Area
        self.scrollable_frame = ctk.CTkScrollableFrame(self, label_text="Replacements & Assets")
        self.scrollable_frame.grid(row=2, column=0, padx=20, pady=10, sticky="nsew")
        self.scrollable_frame.grid_columnconfigure(1, weight=1)
        self.scrollable_frame.grid_columnconfigure(2, weight=1)
        
        # Assets Section
        self.assets_label = ctk.CTkLabel(self.scrollable_frame, text="Image Assets (Optional)", font=ctk.CTkFont(size=16, weight="bold"))
        self.assets_label.grid(row=0, column=0, columnspan=3, padx=10, pady=(10, 5), sticky="w")
        
        self.logo_label = ctk.CTkLabel(self.scrollable_frame, text="New Logo Image (PNG):")
        self.logo_label.grid(row=1, column=0, padx=10, pady=5, sticky="e")
        self.logo_entry = ctk.CTkEntry(self.scrollable_frame)
        self.logo_entry.grid(row=1, column=1, padx=10, pady=5, sticky="ew")
        self.logo_btn = ctk.CTkButton(self.scrollable_frame, text="Select File", command=lambda: self.browse_file(self.logo_entry), width=100)
        self.logo_btn.grid(row=1, column=2, padx=10, pady=5, sticky="w")
        
        self.icon_label = ctk.CTkLabel(self.scrollable_frame, text="New App Icon (PNG):")
        self.icon_label.grid(row=2, column=0, padx=10, pady=5, sticky="e")
        self.icon_entry = ctk.CTkEntry(self.scrollable_frame)
        self.icon_entry.grid(row=2, column=1, padx=10, pady=5, sticky="ew")
        self.icon_btn = ctk.CTkButton(self.scrollable_frame, text="Select File", command=lambda: self.browse_file(self.icon_entry), width=100)
        self.icon_btn.grid(row=2, column=2, padx=10, pady=5, sticky="w")
        
        # Text Replacement Section
        self.text_label = ctk.CTkLabel(self.scrollable_frame, text="Text Replacements", font=ctk.CTkFont(size=16, weight="bold"))
        self.text_label.grid(row=3, column=0, columnspan=3, padx=10, pady=(20, 5), sticky="w")
        
        self.hdr1 = ctk.CTkLabel(self.scrollable_frame, text="Label", font=ctk.CTkFont(weight="bold"))
        self.hdr1.grid(row=4, column=0, padx=10, pady=5)
        self.hdr2 = ctk.CTkLabel(self.scrollable_frame, text="Old Value (To Replace)", font=ctk.CTkFont(weight="bold"))
        self.hdr2.grid(row=4, column=1, padx=10, pady=5)
        self.hdr3 = ctk.CTkLabel(self.scrollable_frame, text="New Value", font=ctk.CTkFont(weight="bold"))
        self.hdr3.grid(row=4, column=2, padx=10, pady=5)
        
        self.row_count = 5
        self.entries = []
        
        # Default Fields
        self.add_row("App Name:", "Ultimate Media Downloader", "")
        self.add_row("Description:", "A modern, high-performance web application that allows you to easily download media", "")
        self.add_row("Github URL:", "https://github.com/Subhan-Haider/Media-Downloader", "")
        self.add_row("Author Name:", "Subhan-Haider", "")
        
        # Footer
        self.footer_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.footer_frame.grid(row=3, column=0, padx=20, pady=(10, 20), sticky="ew")
        self.footer_frame.grid_columnconfigure(1, weight=1)
        
        self.add_btn = ctk.CTkButton(self.footer_frame, text="+ Add Custom Row", command=lambda: self.add_row("Custom:", "", ""), fg_color="transparent", border_width=2, text_color=("gray10", "#DCE4EE"))
        self.add_btn.grid(row=0, column=0, padx=0, pady=0, sticky="w")
        
        self.rebrand_btn = ctk.CTkButton(self.footer_frame, text="Start Rebranding", command=self.on_rebrand, height=40, font=ctk.CTkFont(weight="bold"))
        self.rebrand_btn.grid(row=0, column=2, padx=0, pady=0, sticky="e")
        
        self.note = ctk.CTkLabel(self, text="Note: Restart the Next.js server after rebranding.", text_color="gray")
        self.note.grid(row=4, column=0, pady=(0, 10))

    def browse_path(self):
        folder_selected = filedialog.askdirectory(initialdir=self.path_entry.get())
        if folder_selected:
            self.path_entry.delete(0, 'end')
            self.path_entry.insert(0, folder_selected)
            
    def browse_file(self, entry_widget):
        file_selected = filedialog.askopenfilename(filetypes=[("Image Files", "*.png;*.ico;*.jpg;*.jpeg")])
        if file_selected:
            entry_widget.delete(0, 'end')
            entry_widget.insert(0, file_selected)

    def add_row(self, label_text, default_old, default_new):
        lbl = ctk.CTkLabel(self.scrollable_frame, text=label_text)
        lbl.grid(row=self.row_count, column=0, padx=10, pady=5, sticky="e")
        
        old_entry = ctk.CTkEntry(self.scrollable_frame)
        old_entry.insert(0, default_old)
        old_entry.grid(row=self.row_count, column=1, padx=10, pady=5, sticky="ew")
        
        new_entry = ctk.CTkEntry(self.scrollable_frame)
        new_entry.insert(0, default_new)
        new_entry.grid(row=self.row_count, column=2, padx=10, pady=5, sticky="ew")
        
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
        favicon_val = self.icon_entry.get().strip()
        
        if not replacements and not logo_val and not favicon_val:
            messagebox.showwarning("Warning", "Please fill in at least one text replacement or select an image asset to replace.")
            return
            
        confirm = messagebox.askyesno("Confirm", f"Are you sure you want to search and replace these values and assets in:\n{project_dir}\n\nThis action cannot be undone.")
        if confirm:
            text_count = replace_in_files(project_dir, replacements) if replacements else 0
            asset_count = replace_assets(project_dir, logo_val, favicon_val)
            messagebox.showinfo("Success", f"Rebranding complete!\nModified {text_count} text files.\nReplaced {asset_count} image assets.")

if __name__ == "__main__":
    app = RebrandApp()
    app.mainloop()
