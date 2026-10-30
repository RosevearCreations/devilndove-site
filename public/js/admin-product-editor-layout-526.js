/* Build 526: keep shared photography inside the Media tab, not at the bottom
 * of every Product screen. Moving nodes preserves all existing editor IDs and
 * their event listeners; no extra service or Product request is started. */
(()=>{
 'use strict';
 const media=document.querySelector('#productEditorForm [data-editor-panel="media"]');
 const gallery=document.getElementById('productDistribution406');
 if(media&&gallery)media.append(gallery);
})();
