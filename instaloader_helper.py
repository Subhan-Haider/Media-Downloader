import sys
import json
import http.cookiejar
from instaloader import Instaloader, Post

def download_post(shortcode, cookie_file=None):
    L = Instaloader(quiet=True)
    
    if cookie_file:
        try:
            cj = http.cookiejar.MozillaCookieJar(cookie_file)
            cj.load(ignore_discard=True, ignore_expires=True)
            for cookie in cj:
                L.context._session.cookies.set_cookie(cookie)
        except Exception:
            pass # Silently continue if cookies fail to load

    try:
        post = Post.from_shortcode(L.context, shortcode)
        
        images = []
        if post.typename == 'GraphSidecar':
            for node in post.get_sidecar_nodes():
                if not node.is_video:
                    images.append(node.display_url)
        elif not post.is_video:
            images.append(post.url)
            
        print(json.dumps({"success": True, "images": images}))
            
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No shortcode provided"}))
        sys.exit(1)
        
    shortcode = sys.argv[1]
    cookie_file = sys.argv[2] if len(sys.argv) > 2 else None
    download_post(shortcode, cookie_file)
