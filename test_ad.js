const fs = require('fs');
let code = fs.readFileSync('components/biz/AdEditorForm.tsx', 'utf8');

// 1. Add state variable
code = code.replace(/const \[activeTab, setActiveTab\] = useState<'banner' \| 'detail'>\('banner'\);/, 
`const [activeTab, setActiveTab] = useState<'banner' | 'detail'>('banner');
    const [activeModal, setActiveModal] = useState<'basic' | 'theme' | 'animation' | 'color' | null>(null);`);

// 2. Change the layout of preview & logo
code = code.replace(/<div className="grid grid-cols-1 md:grid-cols-2 gap-6">/, '<div className="flex flex-wrap justify-center gap-6">');

fs.writeFileSync('components/biz/AdEditorForm.tsx', code);
