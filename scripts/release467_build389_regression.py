#!/usr/bin/env python3
"""Build389 source-only acceptance: CAD price, configured choices, media review, video lifecycle."""
from pathlib import Path
import subprocess,sys,sqlite3,json
R=Path(__file__).resolve().parents[1];bad=[]
def t(path):return (R/path).read_text(encoding='utf8')
def check(value,message):
 if not value:bad.append(message)
for name in ['public/js/admin-product-editor-v163.js','public/js/admin-product-media-editor-v172.js',
 'public/js/admin-product-videos-v389.js','public/js/product-videos-v389.js',
 'functions/api/admin/product-editor-options.js','functions/api/admin/product-editor-save.js',
 'functions/api/admin/create-product.js','functions/api/admin/product-image-file.js',
 'functions/api/admin/product-video-attachments.js','functions/api/product-videos.js']:
 r=subprocess.run(['node','--check',str(R/name)],capture_output=True,text=True)
 check(r.returncode==0,'Syntax '+name+': '+r.stderr[-300:])
page=t('admin/product-editor/index.html');js=t('public/js/admin-product-editor-v163.js')
check('name="price" pattern="[0-9]+(\\.[0-9]{1,2})?"' in page,'Price accepts only 0-2 decimals')
check('name="product_category" required' in page and 'name="product_category" maxlength' not in page,'Category dropdown')
check('name="shipping_code"><option' in page,'Shipping code dropdown')
check('name="tax_class_id"><option' in page,'Tax class dropdown')
check('name="inventory_quantity" min="0" step="1" value="1"' in page,'New product starts quantity 1')
check("toFixed(2)" in js and "set('inventory_quantity',1)" in js,'CAD price and new-product defaults')
check('/api/admin/product-editor-options' in js and "focusin" in js,'Options are loaded lazily to protect low-read editor startup')
opts=t('functions/api/admin/product-editor-options.js')
check('SELECT DISTINCT product_category' in opts and 'SELECT DISTINCT shipping_code' in opts and 'FROM tax_classes' in opts,'Real choices including tax classes')
check('product_choice_invalid' in t('functions/api/admin/product-editor-save.js') and 'product_choice_invalid' in t('functions/api/admin/create-product.js'),'Enforce finite choices server-side')
media=t('public/js/admin-product-media-editor-v172.js')
for token in ('productMedia389BatchReview','data-b389-title','data-b389-alt','data-b389-caption','data-b389-public',
 'form.append(\'image_title\',reviews[i].title)','form.append(\'public_use_status\',reviews[i].approval)','files.length>5'):
 check(token in media,'Image review '+token)
backend=t('functions/api/admin/product-image-file.js')
check("image_title:clean(form.get('image_title')" in backend and "public_use_status:clean(form.get('public_use_status')" in backend,'Existing image endpoint saves approved annotation metadata')
video=t('functions/api/admin/product-video-attachments.js')
check('file.size' in video or 'size=Number(file.size' in video,'Video size checked')
check('internal_review' in video and 'product_page_ok' in video and 'no-store' in video,'Video approval')
check("if(context.request.headers.get('Origin')" in video,'Authenticated same-origin video write')
check('product_video_attachments' in t('functions/api/product-videos.js') and "publication_status='product_page_ok'" in t('functions/api/product-videos.js'),'Only approved video is public')
check('product-videos-v389.js' in t('shop/product/index.html'),'Public video player loads')
check('admin-product-videos-v389.js' in t('admin/catalog-media/index.html'),'Admin video review installed')
check('dd:media-selected-product' in media,'Media selected Product event')
check('video.play(' not in t('public/js/product-videos-v389.js') and 'video.autoplay=true' not in t('public/js/product-videos-v389.js'),'No autoplay')
manifest=json.loads(t('migrations/canonical/manifest.json'))
check(len(manifest['migrations'])>=39 and manifest['migrations'][38]['version']==39 and manifest['migrations'][38]['file']=='0039_release467_product_video_attachment.sql','Historical forward-only migration 0039 preserved')
db=sqlite3.connect(':memory:');db.execute('PRAGMA foreign_keys=ON')
try:
 db.executescript("""CREATE TABLE products(product_id INTEGER PRIMARY KEY);CREATE TABLE users(user_id INTEGER PRIMARY KEY);
 INSERT INTO products VALUES(1);INSERT INTO users VALUES(2);""")
 db.executescript(t('migrations/canonical/0039_release467_product_video_attachment.sql'))
 db.execute("""INSERT INTO product_video_attachments(product_id,object_key,video_url,original_filename,mime_type,file_size_bytes,uploaded_by_user_id)
 VALUES(1,'products/1/video/test.mp4','https://assets.devilndove.com/products/1/video/test.mp4','test.mp4','video/mp4',1000,2)""")
 check(db.execute('SELECT publication_status FROM product_video_attachments').fetchone()[0]=='internal_review','Default video is not published')
 for sql,label in [("UPDATE product_video_attachments SET publication_status='unexpected'","invalid publication"),("INSERT INTO product_video_attachments(product_id,object_key,video_url,original_filename,mime_type,file_size_bytes) VALUES (4,'key','https://example.com','x.mp4','video/mp4',1000)","foreign product")]:
  try:db.execute(sql);bad.append('Allowed '+label)
  except sqlite3.IntegrityError:pass
 check(not db.execute('PRAGMA foreign_key_check').fetchall(),'Video FK valid')
except Exception as e:bad.append('Migration test: '+str(e))
auth=json.loads(t('current-development-authority.json'));check(auth.get('build')==389 and auth.get('next_build')==390,'Build authority 389 → 390')
print('RELEASE467_BUILD389_GATE='+('FAIL' if bad else 'GREEN'))
for error in bad:print('FAIL:',error)
sys.exit(bool(bad))
