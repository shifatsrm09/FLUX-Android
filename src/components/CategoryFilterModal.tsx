import React, { useState } from 'react';
import { useFlux } from '../stores/useFluxStore';
import { X, Check } from 'lucide-react';

interface CategoryFilterModalProps {
  onClose: () => void;
}

export const CategoryFilterModal: React.FC<CategoryFilterModalProps> = ({ onClose }) => {
  const { state, getCurrentRoots, toggleCategory, selectCategory } = useFlux();
  const roots = getCurrentRoots();
  const [filterQuery, setFilterQuery] = useState('');

  // Group roots by their category group
  const groups: { [key: string]: typeof roots } = {};
  roots.forEach((root) => {
    const g = root.group || 'Other';
    if (!groups[g]) groups[g] = [];
    groups[g].push(root);
  });

  const allSelected = state.isAllSelected;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#2B2D31] border border-[#4E5058] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#383A40] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Categories</h2>
            <p className="text-xs text-[#949BA4]">
              {state.activeServer === 2 ? 'ICC FTP Media Categories' : 'Dhaka Flix Media Categories'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => selectCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                allSelected
                  ? 'bg-[#5865F2] border-[#5865F2] text-white'
                  : 'bg-white/5 border-white/10 text-[#949BA4] hover:text-white'
              }`}
            >
              {allSelected ? 'All Selected' : 'Select All'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-[#949BA4] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search inside categories */}
        <div className="px-6 pt-3 pb-1">
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter categories..."
            className="w-full px-3.5 py-2 rounded-lg bg-[#1E1F22] border border-[#383A40] text-sm text-white placeholder-[#80848E] focus:outline-none focus:border-[#5865F2]"
          />
        </div>

        {/* Category List grouped */}
        <div className="px-6 py-4 overflow-y-auto space-y-6 flex-1">
          {Object.entries(groups).map(([groupName, groupRoots]) => {
            const filteredGroupRoots = groupRoots.filter((r) =>
              r.name.toLowerCase().includes(filterQuery.toLowerCase())
            );
            if (filteredGroupRoots.length === 0) return null;

            return (
              <div key={groupName} className="space-y-2">
                <h3 className="text-xs font-bold text-[#80848E] uppercase tracking-wider">
                  {groupName}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredGroupRoots.map((root) => {
                    const isChecked = allSelected || state.selectedCategoryIds.includes(root.id);
                    return (
                      <div
                        key={root.id}
                        onClick={() => toggleCategory(root.id)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-[#5865F2]/20 border-[#5865F2]/60 text-white'
                            : 'bg-[#313338] border-transparent hover:border-[#4E5058] text-[#949BA4] hover:text-white'
                        }`}
                      >
                        <span className="text-sm font-medium">{root.name}</span>
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            isChecked
                              ? 'bg-[#5865F2] border-[#5865F2] text-white'
                              : 'border-[#4E5058] bg-[#1E1F22]'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#383A40] bg-[#232428] flex items-center justify-between">
          <span className="text-xs text-[#949BA4]">
            {allSelected
              ? 'All categories active'
              : `${state.selectedCategoryIds.length} categories selected`}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-semibold transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
