#!/usr/bin/env python3
"""Build 452: provenance, private learning stories, reviewed media and no publicity side effects."""
from pathlib import Path
import sqlite3

root=Path(__file__).resolve().parents[1]
db=sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
db.executescript('''
CREATE TABLE users(user_id INTEGER PRIMARY KEY);
CREATE TABLE creative_work_projects(creative_work_project_id INTEGER PRIMARY KEY,product_id INTEGER,privacy_status TEXT,rights_status TEXT);
CREATE TABLE creative_project_product_links(creative_project_product_link_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER,product_id INTEGER);
CREATE TABLE products(product_id INTEGER PRIMARY KEY,inventory_quantity INTEGER);
CREATE TABLE creative_work_events(creative_work_event_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER,entry_status TEXT,media_url TEXT,is_public_candidate INTEGER);
CREATE TABLE product_images(product_image_id INTEGER PRIMARY KEY,product_id INTEGER,image_url TEXT);
CREATE TABLE product_video_attachments(product_video_id INTEGER PRIMARY KEY,product_id INTEGER,video_url TEXT,publication_status TEXT);
CREATE TABLE media_assets(media_asset_id INTEGER PRIMARY KEY,product_id INTEGER,object_key TEXT,public_url TEXT,deleted_at TEXT);
CREATE TABLE media_consent_records(consent_record_id INTEGER PRIMARY KEY,media_url TEXT,consent_status TEXT,consent_scope TEXT,public_use_allowed INTEGER,expires_at TEXT);
CREATE TABLE maker_quality_attempts(maker_quality_attempt_id INTEGER PRIMARY KEY,creative_work_project_id INTEGER);
CREATE TABLE maker_quality_product_links(maker_quality_product_link_id INTEGER PRIMARY KEY,maker_quality_attempt_id INTEGER,product_id INTEGER);
CREATE TABLE maker_quality_release_reviews(maker_quality_release_review_id INTEGER PRIMARY KEY,maker_quality_attempt_id INTEGER,decision TEXT);
INSERT INTO users VALUES(1);
INSERT INTO creative_work_projects VALUES(10,100,'internal','needs_review'),(20,200,'public_candidate','public_allowed');
INSERT INTO products VALUES(100,1),(200,1),(201,1);
INSERT INTO creative_project_product_links VALUES(1,20,201);
INSERT INTO creative_work_events VALUES(1,10,'active','private/therapy-before.webp',0),(2,20,'active','/media/public-before.webp',1),(3,20,'voided','/media/void.webp',1),(4,20,'active','/media/public-after.webp',1);
INSERT INTO product_images VALUES(101,100,'/media/private-product.webp'),(201,200,'/media/accepted-product.webp'),(202,201,'/media/another-product.webp');
INSERT INTO product_video_attachments VALUES(301,200,'/media/reviewed.mp4','product_page_ok'),(302,200,'/media/unreviewed.mp4','internal_review'),(303,200,'/media/blocked.mp4','blocked');
INSERT INTO media_assets VALUES(401,200,'assets/approved-r2.webp','/media/r2-asset.webp',NULL),(402,200,'assets/private-r2.webp',NULL,NULL);
INSERT INTO media_consent_records VALUES(1,'/media/public-before.webp','granted','website_gallery',1,NULL),(2,'/media/accepted-product.webp','granted','product_page',1,NULL),(3,'/media/reviewed.mp4','granted','all_public',1,NULL),(4,'/media/public-after.webp','revoked','website_gallery',0,NULL),(5,'/media/r2-asset.webp','granted','all_public',1,NULL),(6,'/media/another-product.webp','granted','all_public',1,NULL),(7,'/media/unreviewed.mp4','granted','all_public',1,NULL);
INSERT INTO maker_quality_attempts VALUES(1,20);
INSERT INTO maker_quality_product_links VALUES(1,1,200);
INSERT INTO maker_quality_release_reviews VALUES(1,1,'hold');
''')
db.executescript((root/'migrations/canonical/0047_release467_maker_photography_video_stories.sql').read_text())
sha='f'*64
initial_images=db.execute('SELECT * FROM product_images ORDER BY product_image_id').fetchall()
initial_videos=db.execute('SELECT * FROM product_video_attachments ORDER BY product_video_id').fetchall()
initial_products=db.execute('SELECT * FROM products ORDER BY product_id').fetchall()

def reject(label,statement,args=()):
    try: db.execute(statement,args)
    except sqlite3.IntegrityError: return
    raise AssertionError(label+' unexpectedly accepted')

def revision(project,product,label,visibility='internal_only',kind='workshop_journal'):
    db.execute('''INSERT INTO maker_media_story_revisions(creative_work_project_id,product_id,revision_label,story_kind,story_title,narrative,intended_visibility,edited_by_user_id,request_key,payload_sha256)
      VALUES(?,?,?,?,?,?,?,?,?,?)''',(project,product,label,kind,'Real Process and Lessons','This narrative explains what really happened during making.',visibility,1,'story-'+label,sha))
    return db.execute('SELECT last_insert_rowid()').fetchone()[0]

def frame(rev,source,kind,moment,visibility='internal_only',consent=None,principal=0):
    key=f'frame-{rev}-{kind}-{source}'
    db.execute('''INSERT INTO maker_media_story_frames(maker_media_story_revision_id,source_kind,source_id,moment,frame_label,caption,alt_description,is_principal,publication_intent,consent_record_id,added_by_user_id,request_key,payload_sha256)
      VALUES(?,?,?,?,?,?,?,?,?,?,1,?,?)''',(rev,kind,source,moment,'Actual image','Shows a real step of our craft process.','Photograph of the object during making.',principal,visibility,consent,key,sha))

def review(rev,decision,key):
    db.execute('INSERT INTO maker_media_story_release_reviews(maker_media_story_revision_id,decision,review_note,reviewed_by_user_id,request_key,payload_sha256) VALUES(?,?,?,1,?,?)',(rev,decision,'I checked source media, factual context and privacy.',key,sha))

therapy=revision(10,100,'private-therapy-v1',kind='learning_failure')
frame(therapy,1,'creative_event','failure')
review(therapy,'internal_only','keep-private')
reject('private therapy cannot be approved for public use',"INSERT INTO maker_media_story_release_reviews(maker_media_story_revision_id,decision,review_note,reviewed_by_user_id,request_key,payload_sha256) VALUES(?, 'approved_candidate', ?,1,?,?)",(therapy,'A therapeutic project stays internal.','try-publish-private',sha))
reject('private project cannot label a public story',"INSERT INTO maker_media_story_revisions(creative_work_project_id,product_id,revision_label,story_kind,story_title,narrative,intended_visibility,edited_by_user_id,request_key,payload_sha256) VALUES(10,100,'bad-public','product_story','Unsafe public title','Private processing must not be published.','public_candidate',1,'bad-private-story',?)",(sha,))

public=revision(20,200,'finished-public-v1','public_candidate','product_story')
reject('another project Product',"INSERT INTO maker_media_story_revisions(creative_work_project_id,product_id,revision_label,story_kind,story_title,narrative,intended_visibility,edited_by_user_id,request_key,payload_sha256) VALUES(20,100,'wrong-product','product_story','Wrong linked product','The image and Product do not belong here.','internal_only',1,'wrong-product',?)",(sha,))
frame(public,2,'creative_event','before','public_candidate',1,1)
frame(public,201,'product_image','after','public_candidate',2)
frame(public,301,'product_video','tutorial','public_candidate',3)
reject('double principal',"INSERT INTO maker_media_story_frames(maker_media_story_revision_id,source_kind,source_id,moment,frame_label,caption,alt_description,is_principal,publication_intent,added_by_user_id,request_key,payload_sha256) VALUES(?, 'creative_event',4,'after','Second principal','This is another photographed step.','The additional completed piece image.',1,'internal_only',1,'bad-principal',?)",(public,sha))
reject('voided source event',"INSERT INTO maker_media_story_frames(maker_media_story_revision_id,source_kind,source_id,moment,frame_label,caption,alt_description,publication_intent,added_by_user_id,request_key,payload_sha256) VALUES(?,'creative_event',3,'during','Void source','This source was voided earlier.','Image is not a valid current project record.','internal_only',1,'bad-void',?)",(public,sha))
reject('different linked product image',"INSERT INTO maker_media_story_frames(maker_media_story_revision_id,source_kind,source_id,moment,frame_label,caption,alt_description,publication_intent,consent_record_id,added_by_user_id,request_key,payload_sha256) VALUES(?,'product_image',202,'detail','Cross-product','Do not borrow another product image.','Image is from a different linked product.','public_candidate',6,1,'bad-cross-product',?)",(public,sha))
reject('blocked video',"INSERT INTO maker_media_story_frames(maker_media_story_revision_id,source_kind,source_id,moment,frame_label,caption,alt_description,publication_intent,added_by_user_id,request_key,payload_sha256) VALUES(?,'product_video',303,'tutorial','Blocked source','Provider refused this video, keep it private.','Video was explicitly blocked by publication review.','internal_only',1,'bad-blocked',?)",(public,sha))
reject('unapproved video public',"INSERT INTO maker_media_story_frames(maker_media_story_revision_id,source_kind,source_id,moment,frame_label,caption,alt_description,publication_intent,consent_record_id,added_by_user_id,request_key,payload_sha256) VALUES(?,'product_video',302,'tutorial','Unapproved clip','Clip is not approved for public display.','Unreviewed video must stay internal.','public_candidate',7,1,'bad-unapproved',?)",(public,sha))
reject('revoked consent fails public',"INSERT INTO maker_media_story_frames(maker_media_story_revision_id,source_kind,source_id,moment,frame_label,caption,alt_description,publication_intent,consent_record_id,added_by_user_id,request_key,payload_sha256) VALUES(?,'creative_event',4,'after','Revoked photo','Consent was revoked for the finished photo.','The finished item appears without consent.','public_candidate',4,1,'bad-revoked',?)",(public,sha))
reject('consent must match exact URL',"INSERT INTO maker_media_story_frames(maker_media_story_revision_id,source_kind,source_id,moment,frame_label,caption,alt_description,publication_intent,consent_record_id,added_by_user_id,request_key,payload_sha256) VALUES(?,'creative_event',4,'after','Wrong consent','Consent is for a different picture URL.','This is not consent for the pictured item.','public_candidate',2,1,'bad-consent-url',?)",(public,sha))
reject('hold QA prevents public candidate approval',"INSERT INTO maker_media_story_release_reviews(maker_media_story_revision_id,decision,review_note,reviewed_by_user_id,request_key,payload_sha256) VALUES(?,'approved_candidate',?,1,?,?)",(public,'QA currently holds this Product.','qa-hold-review',sha))
db.execute("INSERT INTO maker_quality_release_reviews VALUES(2,1,'approved_for_sale')")
review(public,'approved_candidate','real-approved-candidate')
reject('public-approved revision cannot be silently amended',"INSERT INTO maker_media_story_frames(maker_media_story_revision_id,source_kind,source_id,moment,frame_label,caption,alt_description,publication_intent,added_by_user_id,request_key,payload_sha256) VALUES(?,'creative_event',4,'after','Late photo','Late photo needs a new story revision.','New photo after an editorial decision.','internal_only',1,'late-photo',?)",(public,sha))
reject('cannot rewrite story',"UPDATE maker_media_story_revisions SET narrative='Old story was completely rewritten.' WHERE maker_media_story_revision_id=?",(public,))
reject('cannot delete frame',"DELETE FROM maker_media_story_frames WHERE maker_media_story_revision_id=?",(public,))

later=revision(20,200,'finished-public-v2','public_candidate','tutorial')
frame(later,4,'creative_event','after','internal_only')
reject('private frame cannot be included in approved candidate',"INSERT INTO maker_media_story_release_reviews(maker_media_story_revision_id,decision,review_note,reviewed_by_user_id,request_key,payload_sha256) VALUES(?,'approved_candidate',?,1,?,?)",(later,'We cannot publish a private picture.','private-frame-review',sha))
review(later,'hold','keep-next-draft-private')

# Retest source rights and exact media URLs at editorial review time, not only at linkage.
late=revision(20,200,'late-consent-v1','public_candidate','tutorial')
frame(late,2,'creative_event','before','public_candidate',1)
db.execute("UPDATE media_consent_records SET media_url='/media/unrelated.webp' WHERE consent_record_id=1")
reject('consent cannot be remapped after frame linkage',"INSERT INTO maker_media_story_release_reviews(maker_media_story_revision_id,decision,review_note,reviewed_by_user_id,request_key,payload_sha256) VALUES(?,'approved_candidate',?,1,?,?)",(late,'The actual source URL changed after linkage.','remapped-consent',sha))
db.execute("UPDATE media_consent_records SET media_url='/media/public-before.webp' WHERE consent_record_id=1")
db.execute("UPDATE creative_work_events SET entry_status='voided' WHERE creative_work_event_id=2")
reject('voided photo cannot become public after approval review',"INSERT INTO maker_media_story_release_reviews(maker_media_story_revision_id,decision,review_note,reviewed_by_user_id,request_key,payload_sha256) VALUES(?,'approved_candidate',?,1,?,?)",(late,'The actual source photo was voided after linkage.','voided-late-photo',sha))
review(late,'hold','keep-voided-source-private')

assert db.execute('SELECT * FROM products ORDER BY product_id').fetchall()==initial_products
assert db.execute('SELECT * FROM product_images ORDER BY product_image_id').fetchall()==initial_images
assert db.execute('SELECT * FROM product_video_attachments ORDER BY product_video_id').fetchall()==initial_videos
assert db.execute('PRAGMA foreign_key_check').fetchall()==[]
print('BUILD452_MAKER_MEDIA_SQL=GREEN; real project/Product sources, private therapy, before-after video, captions/alt, principal image uniqueness, exact media consent, QA/public HOLD, immutable revisions, no stock/media/gallery mutation')
