import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import BottomNavBar from '../components/BottomNavBar';
import OpportunityCard from '../components/OpportunityCard';
import type { User, Opportunity } from '../types';

interface OpportunitiesPageProps {
  user: User;
  users: { [key: string]: User };
  onLogout: () => void;
  onNavigate: (path: string) => void;
  opportunities: Opportunity[];
  onAddOpportunity: (opportunityData: Omit<Opportunity, 'id' | 'authorId' | 'timestamp'>) => void;
}

const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({ user, users, onLogout, onNavigate, opportunities, onAddOpportunity }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [description, setDescription] = useState('');
  const [applyLink, setApplyLink] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    if (params.get('action') === 'create') {
      setIsModalOpen(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && organization && description) {
      onAddOpportunity({ title, organization, description, applyLink });
      setIsModalOpen(false);
      setTitle('');
      setOrganization('');
      setDescription('');
      setApplyLink('');
      onNavigate('#/opportunities'); // Clear URL params
    }
  };

  return (
    <div className="min-h-screen bg-background-dark text-text-primary-dark">
      <Header user={user} onLogout={onLogout} onNavigate={onNavigate} />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pb-20 md:pb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Opportunities Hub</h1>
            <p className="mt-2 text-text-secondary-dark">Find internships, jobs, competitions, and projects.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors"
          >
            Post an Opportunity
          </button>
        </div>

        {opportunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {opportunities.map(opp => (
              <OpportunityCard key={opp.id} opportunity={opp} author={users[opp.authorId]} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-surface-dark rounded-lg">
            <p className="text-text-secondary-dark">No opportunities posted yet. Be the first!</p>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-surface-dark p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h3 className="text-xl font-bold mb-4">New Opportunity</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Job Title / Position" value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-gray-700 text-text-primary-dark rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-brand-secondary"/>
                    <input type="text" placeholder="Company / Organization" value={organization} onChange={e => setOrganization(e.target.value)} required className="w-full bg-gray-700 text-text-primary-dark rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-brand-secondary"/>
                    <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} required rows={4} className="w-full bg-gray-700 text-text-primary-dark rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-brand-secondary resize-none"/>
                    <input type="url" placeholder="Application Link (optional)" value={applyLink} onChange={e => setApplyLink(e.target.value)} className="w-full bg-gray-700 text-text-primary-dark rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-brand-secondary"/>
                    <div className="flex justify-end space-x-2 mt-2">
                        <button type="button" onClick={() => { setIsModalOpen(false); onNavigate('#/opportunities'); }} className="px-4 py-2 rounded-md text-text-secondary-dark hover:bg-gray-600">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-brand-secondary text-white hover:bg-blue-500">Post</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      <BottomNavBar onNavigate={onNavigate} currentRoute="#/opportunities" />
    </div>
  );
};

export default OpportunitiesPage;