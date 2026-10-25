export function isAdministrator(user:{email:string}|null,adminEmail:string|undefined){
 return !!user&&!!adminEmail&&user.email.trim().toLowerCase()===adminEmail.trim().toLowerCase();
}
