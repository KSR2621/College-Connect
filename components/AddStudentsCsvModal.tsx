
import React, { useState, useMemo } from 'react';
import type { User } from '../types';
import { UploadIcon, CloseIcon, UsersIcon, CheckCircleIcon, XCircleIcon } from './Icons';

interface AddStudentsCsvModalProps {
    isOpen: boolean;
    onClose: () => void;
    department: string;
    onCreateUsersBatch: (usersData: Omit<User, 'id'>[]) => Promise<{ successCount: number; errors: { email: string; reason: string }[] }>;
}

type ParsedStudent = { name: string; email: string; year: number; rollNo?: string; division?: string; error?: string; };
type Step = 'upload' | 'preview' | 'result';

const AddStudentsCsvModal: React.FC<AddStudentsCsvModalProps> = ({ isOpen, onClose, department, onCreateUsersBatch }) => {
    const [step, setStep] = useState<Step>('upload');
    const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
    const [fileName, setFileName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ successCount: number; errors: { email: string; reason: string }[] } | null>(null);

    if (!isOpen) return null;

    const resetState = () => {
        setStep('upload');
        setParsedData([]);
        setFileName('');
        setIsLoading(false);
        setResult(null);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };
    
    const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            let text = e.target?.result as string;
            if (!text) return;

            if (text.startsWith('\uFEFF')) {
                text = text.substring(1);
            }
            
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
            if (lines.length < 2) {
                alert("CSV file must have a header row and at least one data row.");
                return;
            }
            const headerLine = lines.shift()!.trim();
            const header = headerLine.toLowerCase().split(',').map(h => h.trim());
            
            // Looser check for 'Roll. no'
            const rollIndex = header.findIndex(h => h.includes('roll') || h.includes('id'));
            const nameIndex = header.indexOf('name');
            const emailIndex = header.indexOf('email');
            const yearIndex = header.indexOf('year');
            const divIndex = header.findIndex(h => h === 'div' || h === 'division');

            if (nameIndex === -1 || emailIndex === -1 || yearIndex === -1) {
                alert("CSV header must contain 'Name', 'Email', and 'Year' columns. 'Roll. no' and 'Div' are optional but recommended.");
                return;
            }

            const data = lines.map((line): ParsedStudent => {
                const values = line.split(',');
                const name = values[nameIndex]?.trim() || '';
                const email = values[emailIndex]?.trim() || '';
                const yearStr = values[yearIndex]?.trim() || '';
                const rollNo = rollIndex !== -1 ? values[rollIndex]?.trim() : undefined;
                const division = divIndex !== -1 ? values[divIndex]?.trim() : undefined;
                
                const year = parseInt(yearStr, 10);
                let error;

                if (!name || !email || !yearStr) error = "Missing name, email, or year.";
                else if (!validateEmail(email)) error = "Invalid email format.";
                else if (isNaN(year) || year < 1 || year > 5) error = "Year must be a number from 1 to 5.";

                return { name, email, year, rollNo, division, error };
            });

            setParsedData(data);
            setStep('preview');
        };
        reader.readAsText(file);
    };

    const handleSubmit = async () => {
        const validUsers = parsedData.filter(p => !p.error);
        if (validUsers.length === 0) {
            alert("No valid students to add. Please check your file.");
            return;
        }
        
        setIsLoading(true);
        const usersData = validUsers.map(u => ({
            name: u.name,
            email: u.email,
            department,
            tag: 'Student' as 'Student',
            yearOfStudy: u.year,
            rollNo: u.rollNo,
            division: u.division
        }));
        
        const res = await onCreateUsersBatch(usersData);
        setResult(res);
        setIsLoading(false);
        setStep('result');
    };

    const CsvTemplateLink = () => {
        const csvContent = "Roll. no,Name,Email,Year,Div\n101,Jane Doe,jane.doe@example.com,1,A\n102,John Smith,john.smith@example.com,2,B";
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        return <a href={url} download="student_template.csv" className="text-sm text-primary hover:underline">Download template.csv</a>;
    };

    const renderContent = () => {
        switch (step) {
            case 'upload':
                return (
                    <div className="text-center">
                        <label htmlFor="csv-upload-student" className="cursor-pointer group">
                            <div className="p-8 border-2 border-dashed border-border group-hover:border-primary group-hover:bg-primary/5 rounded-lg transition-colors">
                                <UploadIcon className="w-12 h-12 mx-auto text-text-muted group-hover:text-primary transition-colors" />
                                <p className="mt-4 font-semibold text-foreground">Click to upload or drag & drop</p>
                                <p className="text-sm text-text-muted">CSV file up to 5MB</p>
                            </div>
                        </label>
                        <input id="csv-upload-student" type="file" accept=".csv" className="hidden" onChange={handleFileChange}/>
                        <div className="mt-4 text-sm text-text-muted">
                            <p>Expected columns: Roll. no, Name, Email, Year, Div</p>
                            <CsvTemplateLink />
                        </div>
                    </div>
                );
            case 'preview':
                return (
                    <div>
                        <p className="font-semibold text-foreground mb-2">Reviewing: <span className="font-normal">{fileName}</span></p>
                        <p className="text-sm text-text-muted mb-4">{parsedData.filter(p => !p.error).length} valid students found. Any rows with errors will be skipped.</p>
                        <div className="max-h-64 overflow-y-auto no-scrollbar border border-border rounded-lg">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-700">
                                    <tr>
                                        <th className="p-2 text-left font-semibold">Roll No</th>
                                        <th className="p-2 text-left font-semibold">Name</th>
                                        <th className="p-2 text-left font-semibold">Email</th>
                                        <th className="p-2 text-left font-semibold">Year</th>
                                        <th className="p-2 text-left font-semibold">Div</th>
                                        <th className="p-2 text-left font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedData.map((row, index) => (
                                        <tr key={index} className="border-t border-border">
                                            <td className="p-2">{row.rollNo || '-'}</td>
                                            <td className="p-2">{row.name}</td>
                                            <td className="p-2">{row.email}</td>
                                            <td className="p-2">{row.year || 'N/A'}</td>
                                            <td className="p-2">{row.division || '-'}</td>
                                            <td className="p-2">
                                                {row.error ? 
                                                    <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{row.error}</span> : 
                                                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Ready</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'result':
                return (
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-foreground mb-4">Batch Import Complete</h3>
                        <div className="flex justify-center gap-8 mb-6">
                            <div className="text-emerald-600">
                                <CheckCircleIcon className="w-10 h-10 mx-auto"/>
                                <p className="font-bold text-2xl">{result?.successCount}</p>
                                <p className="text-sm">Successfully Added</p>
                            </div>
                             <div className="text-red-600">
                                <XCircleIcon className="w-10 h-10 mx-auto"/>
                                <p className="font-bold text-2xl">{result?.errors.length}</p>
                                <p className="text-sm">Failed / Skipped</p>
                            </div>
                        </div>
                        {result && result.errors.length > 0 && (
                             <div className="text-left">
                                <p className="font-semibold mb-2">Details for failed entries:</p>
                                <div className="max-h-40 overflow-y-auto no-scrollbar bg-slate-100 dark:bg-slate-700 p-2 rounded-md border border-border">
                                    {result.errors.map((err, i) => <p key={i} className="text-sm"><b>{err.email}:</b> {err.reason}</p>)}
                                </div>
                             </div>
                        )}
                    </div>
                );
        }
    };
    
    const getModalTitle = () => {
        switch (step) {
            case 'upload': return 'Add Students via CSV';
            case 'preview': return 'Confirm Students';
            case 'result': return 'Import Results';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={handleClose}>
            <div className="bg-card dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h2 className="text-xl font-bold text-foreground">{getModalTitle()}</h2>
                    <button onClick={handleClose} className="p-1 rounded-full hover:bg-muted dark:hover:bg-slate-700"><CloseIcon className="w-5 h-5"/></button>
                </div>
                <div className="flex-1 p-6 overflow-y-auto">
                    {renderContent()}
                </div>
                <div className="p-4 bg-muted/50 dark:bg-slate-900/50 border-t border-border flex justify-end gap-3">
                    {step === 'upload' && <button onClick={handleClose} className="px-4 py-2 font-semibold text-foreground bg-muted rounded-lg hover:bg-muted/80">Cancel</button>}
                    {step === 'preview' && (
                        <>
                            <button onClick={() => setStep('upload')} className="px-4 py-2 font-semibold text-foreground bg-muted rounded-lg hover:bg-muted/80">Back</button>
                            <button onClick={handleSubmit} disabled={isLoading || parsedData.filter(p => !p.error).length === 0} className="px-6 py-2 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-wait">
                                {isLoading ? 'Adding...' : `Add ${parsedData.filter(p => !p.error).length} Students`}
                            </button>
                        </>
                    )}
                     {step === 'result' && <button onClick={handleClose} className="px-6 py-2 font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90">Done</button>}
                </div>
            </div>
        </div>
    );
};

export default AddStudentsCsvModal;
