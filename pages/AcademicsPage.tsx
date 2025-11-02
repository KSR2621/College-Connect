import React from 'react';
import type { User } from '../types';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import { auth } from '../firebase';
import { BookOpenIcon, BellIcon, CheckSquareIcon } from '../components/Icons';

interface AcademicsPageProps {
  currentUser: User;
  onNavigate: (path: string) => void;
  currentPath: string;
}

const AcademicsPage: React.FC<AcademicsPageProps> = ({ currentUser, onNavigate, currentPath }) => {

    const handleLogout = async () => {
        await auth.signOut();
        onNavigate('#/');
    };

    return (
        <div className="bg-muted/50 min-h-screen">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={onNavigate} currentPath={currentPath} />
            
            <main className="container mx-auto px-4 pt-8 pb-20 md:pb-8">
                {/* Hero Section */}
                <div className="relative bg-card p-8 rounded-2xl shadow-lg border border-border overflow-hidden mb-12 text-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-50"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl mx-auto flex items-center justify-center mb-4">
                            <BookOpenIcon className="w-8 h-8"/>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground">Academics Hub</h1>
                        <p className="mt-3 text-lg text-text-muted max-w-2xl mx-auto">
                            Your central place for courses, announcements, and assignments.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Announcements */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3"><BellIcon className="w-6 h-6 text-primary"/>Announcements</h2>
                        <div className="bg-card p-6 rounded-lg border border-border space-y-4">
                             <div className="border-b border-border pb-3">
                                <p className="font-semibold text-card-foreground">Mid-term Exam Schedule</p>
                                <p className="text-sm text-text-muted mt-1">The schedule for the upcoming mid-term exams has been posted. Please review it carefully.</p>
                                <p className="text-xs text-text-muted mt-2">Posted by: Dr. Evelyn Reed</p>
                            </div>
                            <div>
                                <p className="font-semibold text-card-foreground">Library Hours Extended</p>
                                <p className="text-sm text-text-muted mt-1">For the exam period, the main library will be open 24/7 starting next Monday.</p>
                                <p className="text-xs text-text-muted mt-2">Posted by: Campus Administration</p>
                            </div>
                        </div>
                    </div>

                    {/* My Courses */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-foreground">My Courses</h2>
                        <div className="bg-card p-6 rounded-lg border border-border space-y-3">
                            <div className="bg-muted/50 p-3 rounded-md">
                                <p className="font-bold text-card-foreground">CS101 - Introduction to Programming</p>
                                <p className="text-sm text-text-muted">Prof. Alan Turing</p>
                            </div>
                             <div className="bg-muted/50 p-3 rounded-md">
                                <p className="font-bold text-card-foreground">MATH203 - Linear Algebra</p>
                                <p className="text-sm text-text-muted">Prof. Ada Lovelace</p>
                            </div>
                             <div className="bg-muted/50 p-3 rounded-md">
                                <p className="font-bold text-card-foreground">ENG110 - Literature and Composition</p>
                                <p className="text-sm text-text-muted">Prof. Mary Shelley</p>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Assignments */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3"><CheckSquareIcon className="w-6 h-6 text-secondary"/>Upcoming Assignments</h2>
                        <div className="bg-card p-6 rounded-lg border border-border space-y-4">
                             <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-card-foreground">CS101 - Final Project Proposal</p>
                                    <p className="text-sm text-text-muted">Due in 3 days</p>
                                </div>
                                <button className="text-sm font-semibold bg-primary/10 text-primary py-1 px-3 rounded-full hover:bg-primary/20">View Details</button>
                            </div>
                             <div className="flex justify-between items-center border-t border-border pt-4">
                                <div>
                                    <p className="font-semibold text-card-foreground">ENG110 - Essay on Frankenstein</p>
                                    <p className="text-sm text-text-muted">Due in 5 days</p>
                                </div>
                                <button className="text-sm font-semibold bg-primary/10 text-primary py-1 px-3 rounded-full hover:bg-primary/20">View Details</button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            
            <BottomNavBar currentUser={currentUser} onNavigate={onNavigate} currentPage={currentPath} />
        </div>
    );
};

export default AcademicsPage;