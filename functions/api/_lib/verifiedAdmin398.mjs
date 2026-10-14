// Release 467 Build 398 — accept only the user verified by centralized module-route middleware.
// Its session resolution is authoritative; a redundant legacy sessions-table lookup can falsely reject a live admin.
export function verifiedAdminFromModule(context){
 const access=context?.data?.ddModuleAccess, user=access?.user;
 if(access?.allowed!==true||!user||String(user.role||'').toLowerCase()!=='admin'||
    Number(user.is_active||0)!==1||!Number.isSafeInteger(Number(user.user_id))||Number(user.user_id)<1)return null;
 return {user_id:Number(user.user_id),email:String(user.email||''),display_name:String(user.display_name||'')};
}
