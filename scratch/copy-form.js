const fs = require('fs');
const content = fs.readFileSync('components/mypage/SettingsModal.tsx', 'utf8');

let newContent = content.replace(/export function SettingsModal\(\) \{/g, 'export default function BizProfileForm() {');
newContent = newContent.replace(/const \[isOpen, setIsOpen\] = useState\(false\);/g, '');
newContent = newContent.replace(/useEffect\(\(\) => \{[\s\S]*?\}, \[isOpen\]\);/g, `useEffect(() => {
    fetchUserData();
    setAutoLogin(document.cookie.includes('foxmon_auto_login=1'));
}, []);`);

newContent = newContent.replace(/<Dialog open=\{isOpen\} onOpenChange=\{setIsOpen\}>[\s\S]*?<DialogContent[^>]*>/, `<div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">`);
newContent = newContent.replace(/<\/DialogContent>\s*<\/Dialog>/, `</div>`);
newContent = newContent.replace(/<DialogHeader[^>]*>/, `<div className="px-6 py-5 flex-shrink-0 bg-white z-10 border-b border-gray-100 flex flex-row items-center justify-between">`);
newContent = newContent.replace(/<\/DialogHeader>/, `</div>`);
newContent = newContent.replace(/<DialogTitle[^>]*>/, `<h2 className="font-extrabold text-lg flex items-center gap-2 text-gray-900">`);
newContent = newContent.replace(/<\/DialogTitle>/, `</h2>`);
newContent = newContent.replace(/<DialogDescription[^>]*>/, `<p className="font-medium text-[13px] text-gray-500 mt-1">`);
newContent = newContent.replace(/<\/DialogDescription>/, `</p>`);
newContent = newContent.replace(/<Dialog open=\{isPasswordModalOpen\} onOpenChange=\{setIsPasswordModalOpen\}>/g, '<Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>');
// Wait, Dialog is still used for password modal! We need to keep Dialog imports.

// Let's replace the whole file exactly using AST or just write it via string replace.
// Let's just output the file.

fs.writeFileSync('app/biz/profile/BizProfileForm.tsx', newContent, 'utf8');
console.log('Done');
