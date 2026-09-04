#!/usr/bin/env python3
"""Current public search-engine, sitemap and one-H1 source gate."""
from __future__ import annotations
import re
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[1];FAIL=[];DOMAIN='devilndove.com';NS={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
class Doc(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True);self.h1=0;self.title=[];self.in_title=False;self.meta=[];self.links=[]
 def handle_starttag(self,tag,attrs):
  a={str(k).lower():str(v or '') for k,v in attrs};tag=tag.lower()
  if tag=='h1':self.h1+=1
  elif tag=='title':self.in_title=True
  elif tag=='meta':self.meta.append(a)
  elif tag=='link':self.links.append(a)
 def handle_endtag(self,tag):
  if tag.lower()=='title':self.in_title=False
 def handle_data(self,data):
  if self.in_title:self.title.append(data)
 @property
 def title_text(self):return ' '.join(''.join(self.title).split())
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(rel):return (ROOT/rel).read_text(encoding='utf-8',errors='replace')
def meta(doc,name):return [m.get('content','').strip() for m in doc.meta if m.get('name','').lower()==name.lower()]
def canon(doc):return [l.get('href','').strip() for l in doc.links if 'canonical' in l.get('rel','').lower().split()]
def route_file(url):
 p=urlsplit(url).path
 return ROOT/'index.html' if p=='/' else ROOT/p.strip('/')/'index.html'
tree=ET.fromstring(read('sitemap.xml'));urls=[x.text.strip() for x in tree.findall('s:url/s:loc',NS) if x.text and x.text.strip()]
req(len(urls)==len(set(urls)),'sitemap contains duplicate URLs')
for forbidden in ('/search/','/shop/product/','/admin/','/api/','/members/','/login/','/cart/'):
 req(not any(urlsplit(u).path.startswith(forbidden) for u in urls),f'sitemap exposes non-index destination {forbidden}')
for url in urls:
 parts=urlsplit(url);req(parts.scheme=='https' and parts.netloc==DOMAIN and not parts.query and not parts.fragment,f'unclean sitemap URL: {url}')
 path=route_file(url)
 if not path.is_file():FAIL.append(f'sitemap route has no source page: {url}');continue
 doc=Doc();doc.feed(path.read_text(encoding='utf-8',errors='replace'));rel=path.relative_to(ROOT)
 req(doc.h1==1,f'{rel}: expected exactly one H1, found {doc.h1}')
 req(bool(doc.title_text),f'{rel}: missing title');req(bool(meta(doc,'viewport')),f'{rel}: missing viewport')
 robots=','.join(meta(doc,'robots')).replace(' ','').lower();req('noindex' not in robots,f'{rel}: sitemap page must not be noindex')
 c=canon(doc);req(c==[url],f'{rel}: canonical must be exactly {url!r}; found {c!r}')
 if urlsplit(url).path not in {'/privacy/','/terms/','/data-deletion/','/social-connections/'}:
  desc=meta(doc,'description');req(len(desc)==1 and len(desc[0])>=40,f'{rel}: useful meta description required')
search=read('search/index.html').lower().replace(' ','');req('name="robots"' in search and 'content="noindex,follow"' in search,'internal search must be noindex,follow');req(len(re.findall(r'<h1(?:\s|>)',search,re.I))==1,'internal search must retain one H1')
req('Sitemap: https://devilndove.com/sitemap.xml' in read('robots.txt'),'robots.txt must advertise canonical sitemap')
middleware=read('functions/_middleware.js')
for needle in ('publicProductRequestInfo',"productRequest.slug ? 'index,follow' : 'noindex,follow'",'productRequest.canonical'):req(needle in middleware,f'product-shell/indexing middleware missing {needle!r}')
# Runtime H1 creation is normally forbidden. Three narrowly proven cases are allowed:
# 1) the Workshop Journal story replaces the entire <main> that contains the source H1,
#    so exactly one story H1 remains after render; and
# 2) the two admin document/print scripts create separate popup/print documents whose
#    markup itself contains exactly one H1. They do not add an H1 to the current page.
SAFE_RUNTIME_H1={
 'public/js/workshop-journal-story.js':("data-workshop-journal-story","mount.innerHTML =",'<h1>'),
 'public/js/admin-packaging-print-source-v299.js':('win.document.write','<!doctype html>','<h1>Packaging print could not be prepared</h1>'),
 'public/js/admin-customer-documents.js':('function documentHtml','<!doctype html>','.title h1'),
}
dynamic=[];safe_seen=set()
for base in ('public/js','js'):
 folder=ROOT/base
 if not folder.is_dir():continue
 for path in folder.rglob('*'):
  if not path.is_file() or path.suffix.lower() not in {'.js','.mjs'}:continue
  text=path.read_text(encoding='utf-8',errors='replace');rel=str(path.relative_to(ROOT)).replace('\\','/')
  has_h1=bool(re.search(r"createElement\(\s*['\"]h1['\"]",text,re.I) or re.search(r'<h1(?:\s|>)',text,re.I))
  if not has_h1:continue
  proof=SAFE_RUNTIME_H1.get(rel)
  if proof and all(needle in text for needle in proof):safe_seen.add(rel);continue
  dynamic.append(rel)
req(not dynamic,f'runtime scripts may not add H1 elements to an existing document: {dynamic[:20]}')
for rel in SAFE_RUNTIME_H1:req(rel in safe_seen,f'safe runtime H1 proof drifted or disappeared: {rel}')
heading_guard=read('public/js/public-heading-guard.js')
req('querySelectorAll(\'h1\')' in heading_guard or 'querySelectorAll("h1")' in heading_guard,'public H1 runtime guard must remain active')
print('CURRENT SEARCH / SEO / ONE-H1 GATE');print(f'Sitemap index destinations: {len(urls)}')
if FAIL:
 for i,x in enumerate(FAIL,1):print(f'{i:03d}. FAIL — {x}')
 raise SystemExit(1)
print('CURRENT SEARCH / SEO / ONE-H1 GATE: PASS')
