import React from 'react';
import { useFlux } from '../stores/useFluxStore';
import { FluxIcon } from './FluxIcon';

export interface CategoryGroup {
  title: string;
  items: Array<{ id: string; name: string }>;
}

export const DHAKA_FLIX_GROUPS: CategoryGroup[] = [
  {
    title: 'English Movies',
    items: [
      { id: 'english_movies', name: 'English Movies' },
      { id: 'english_movies_1080p', name: 'English Movies 1080p' },
      { id: 'awards_tv_shows', name: 'Awards & TV Shows' }
    ]
  },
  {
    title: 'Hindi Movies',
    items: [
      { id: 'hindi_movies', name: 'Hindi Movies' },
      { id: 'south_movies_hindi_dubbed', name: 'South-Movie Hindi Dubbed' }
    ]
  },
  {
    title: 'Animation',
    items: [
      { id: 'animation_movies', name: 'Animation Movies' },
      { id: 'animation_movies_1080p', name: 'Animation Movies 1080p' }
    ]
  },
  {
    title: 'Other Movies',
    items: [
      { id: 'foreign_movies', name: 'Foreign Movies' },
      { id: 'documentary', name: 'Documentary' },
      { id: 'movies_3d', name: '3D Movies' }
    ]
  },
  {
    title: 'Regional Movies',
    items: [
      { id: 'south_movies', name: 'South Indian Movies' },
      { id: 'kolkata_bangla_movies', name: 'Kolkata Bangla Movies' },
      { id: 'satyajit_ray_films', name: 'Satyajit Ray Films' }
    ]
  },
  {
    title: 'TV & Web Series',
    items: [
      { id: 'tv_web_series', name: 'TV & Web Series' },
      { id: 'korean_series', name: 'Korean TV & Web Series' },
      { id: 'cartoon_tv_series', name: 'Cartoon TV Series' },
      { id: 'wwe_aew', name: 'WWE & AEW Wrestling' }
    ]
  }
];

export const ICC_FTP_GROUPS: CategoryGroup[] = [
  {
    title: 'English Movies',
    items: [
      { id: 'icc_eng_movies', name: 'English Movies' },
      { id: 'icc_excl_1080p', name: 'Exclusive Full-HD' },
      { id: 'icc_4k', name: '4K Movies' },
      { id: 'icc_3d', name: '3D Movies' }
    ]
  },
  {
    title: 'Hindi Movies',
    items: [
      { id: 'icc_hindi', name: 'Hindi Movies' },
      { id: 'icc_south_dubbed', name: 'South Hindi Dubbed' },
      { id: 'icc_dual_audio', name: 'Dual Audio' }
    ]
  },
  {
    title: 'Animation',
    items: [
      { id: 'icc_animated', name: 'Animation Movies' },
      { id: 'icc_cartoon_tv', name: 'Cartoon TV Series' },
      { id: 'icc_anime', name: 'Anime TV Series' }
    ]
  },
  {
    title: 'Other Movies',
    items: [
      { id: 'icc_tamil', name: 'Tamil & Telugu' },
      { id: 'icc_foreign', name: 'Foreign Movies' },
      { id: 'icc_doc', name: 'Documentary' }
    ]
  },
  {
    title: 'Regional Movies',
    items: [
      { id: 'icc_kolkata', name: 'Kolkata Bangla' },
      { id: 'icc_bangladesh', name: 'Bangladesh Bangla' },
      { id: 'icc_malayalam', name: 'Malayalam Movies' }
    ]
  },
  {
    title: 'TV & Web Series',
    items: [
      { id: 'icc_tv_eng', name: 'English TV Series' },
      { id: 'icc_tv_hindi', name: 'Hindi TV Series' },
      { id: 'icc_korean', name: 'Korean TV Series' },
      { id: 'icc_wwe', name: 'WWE & AEW' }
    ]
  }
];

interface CategoryFilterSectionProps {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onSelectionChanged?: () => void;
}

export const CategoryFilterSection: React.FC<CategoryFilterSectionProps> = ({
  isExpanded,
  onToggleExpanded,
  onSelectionChanged
}) => {
  const { state, toggleCategory, selectCategory } = useFlux();

  const groups = state.activeServer === 1 ? DHAKA_FLIX_GROUPS : ICC_FTP_GROUPS;
  const totalCategories = groups.reduce((acc, g) => acc + g.items.length, 0);
  const selectedCount = state.isAllSelected
    ? totalCategories
    : state.selectedCategoryIds.length;

  const handleToggleAll = () => {
    if (state.isAllSelected) {
      // Unselect all (keep first category selected)
      selectCategory(groups[0].items[0].id);
    } else {
      selectCategory('all');
    }
    if (onSelectionChanged) onSelectionChanged();
  };

  const handleToggleItem = (id: string) => {
    toggleCategory(id);
    if (onSelectionChanged) onSelectionChanged();
  };

  return (
    <div className="w-full space-y-5 select-none animate-fadeIn">
      {/* "All Categories" Bar matching CategoryFilterSection.qml lines 212-334 */}
      <div className="w-full h-14 rounded-xl bg-[#313338] hover:bg-[#383A40] border border-[#2B2D31] hover:border-[#4E5058] transition-colors flex items-center justify-between px-4 sm:px-5 shadow-md">
        {/* Clickable toggle area */}
        <div
          onClick={handleToggleAll}
          className="flex items-center space-x-3 cursor-pointer grow py-2"
        >
          <span
            className={`text-sm font-semibold transition-colors ${
              state.isAllSelected ? 'text-white' : 'text-[#949BA4]'
            }`}
          >
            All Categories
          </span>
          {state.isAllSelected && (
            <span className="text-[#5865F2] font-bold text-base leading-none">✓</span>
          )}
        </div>

        {/* Right side: Selected counter pill + Expand/Collapse button */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Selected Counter Pill */}
          <div className="h-[26px] px-3 rounded-full bg-[#383A40] border border-[#2B2D31] flex items-center justify-center">
            <span className="text-[11px] font-semibold text-[#949BA4]">
              {selectedCount} / {totalCategories} selected
            </span>
          </div>

          {/* Expand / Collapse Button */}
          <button
            onClick={onToggleExpanded}
            className="h-8 px-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <span className="text-xs font-semibold">Categories</span>
            <FluxIcon
              name={isExpanded ? 'chevronUp' : 'chevronDown'}
              size={14}
              color="#949BA4"
            />
          </button>
        </div>
      </div>

      {/* Category Columns matching CategoryFilterSection.qml lines 337-402 */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-5 pt-1 animate-fadeIn">
          {groups.map((group, gIdx) => (
            <div key={gIdx} className="flex flex-col space-y-2">
              {/* Column Heading with 3px blue vertical accent bar */}
              <div className="h-[30px] flex items-center space-x-2.5">
                <div className="w-[3px] h-3.5 rounded-[1.5px] bg-[#5865F2]" />
                <h3 className="text-sm font-bold text-white tracking-wide truncate">
                  {group.title}
                </h3>
              </div>

              {/* Items in this group */}
              <div className="flex flex-col space-y-2">
                {group.items.map((item) => {
                  const isSelected =
                    state.isAllSelected || state.selectedCategoryIds.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleItem(item.id)}
                      className={`h-[38px] px-3.5 rounded-[10px] bg-[#313338] hover:bg-[#383A40] border transition-colors cursor-pointer flex items-center justify-between ${
                        isSelected ? 'border-[#2B2D31]' : 'border-[#2B2D31] opacity-70'
                      } hover:border-[#4E5058]`}
                    >
                      <span
                        className={`text-[13px] truncate pr-2 ${
                          isSelected ? 'text-white font-medium' : 'text-[#949BA4]'
                        }`}
                        title={item.name}
                      >
                        {item.name}
                      </span>
                      {isSelected && (
                        <span className="text-[#5865F2] font-bold text-sm leading-none shrink-0">
                          ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
