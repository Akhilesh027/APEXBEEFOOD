import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Sliders,
  X,
  Link,
  Utensils,
  CheckSquare,
  Square,
  AlertCircle,
} from 'lucide-react';
import { foodService } from '../../services/foodService';

interface IAddonItemInput {
  name: string;
  additionalPrice: number;
}

export const AddonManagement: React.FC = () => {
  const navigate = useNavigate();

  const [groups, setGroups] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Addon Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [required, setRequired] = useState(false);
  const [minSelection, setMinSelection] = useState(0);
  const [maxSelection, setMaxSelection] = useState(1);
  const [selectedCreationItemIds, setSelectedCreationItemIds] = useState<string[]>([]);
  const [creationDishSearch, setCreationDishSearch] = useState('');

  // Dynamic Addon Option Items
  const [addonOptions, setAddonOptions] = useState<IAddonItemInput[]>([
    { name: '', additionalPrice: 0 },
  ]);

  // Link Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [activeGroupToLink, setActiveGroupToLink] = useState<any | null>(null);
  const [selectedMenuItemIds, setSelectedMenuItemIds] = useState<string[]>([]);
  const [dishSearch, setDishSearch] = useState('');
  const [savingLinks, setSavingLinks] = useState(false);

  const loadAddonData = async () => {
    setLoading(true);
    try {
      const [addonRes, itemsRes] = await Promise.allSettled([
        foodService.getAddons(),
        foodService.getMenuItems(),
      ]);

      if (addonRes.status === 'fulfilled' && addonRes.value.data) {
        if (addonRes.value.data.groups) setGroups(addonRes.value.data.groups);
        if (addonRes.value.data.items) setItems(addonRes.value.data.items);
        if (addonRes.value.data.mappings) setMappings(addonRes.value.data.mappings);
        if (addonRes.value.data.menuItems) setMenuItems(addonRes.value.data.menuItems);
      }

      if (itemsRes.status === 'fulfilled' && itemsRes.value.data?.items?.length) {
        setMenuItems(itemsRes.value.data.items);
      }
    } catch (err) {
      console.error('Failed to load addon data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddonData();
  }, []);

  const handleAddOptionRow = () => {
    setAddonOptions((prev) => [...prev, { name: '', additionalPrice: 0 }]);
  };

  const handleRemoveOptionRow = (index: number) => {
    if (addonOptions.length === 1) return;
    setAddonOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, field: 'name' | 'additionalPrice', value: any) => {
    const updated = [...addonOptions];
    updated[index] = { ...updated[index], [field]: value };
    setAddonOptions(updated);
  };

  const handleCreateAddonGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      alert('Please enter an Add-on Group Name');
      return;
    }

    const validOptions = addonOptions.filter((opt) => opt.name.trim() !== '');
    if (validOptions.length === 0) {
      alert('Please add at least one valid Add-on option');
      return;
    }

    try {
      await foodService.createAddonGroup({
        name: groupName,
        required,
        minSelection: required ? Math.max(1, minSelection) : minSelection,
        maxSelection: Math.max(1, maxSelection),
        items: validOptions,
        menuItemIds: selectedCreationItemIds,
      });

      setShowCreateModal(false);
      setGroupName('');
      setRequired(false);
      setMinSelection(0);
      setMaxSelection(1);
      setAddonOptions([{ name: '', additionalPrice: 0 }]);
      setSelectedCreationItemIds([]);
      loadAddonData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create add-on group');
    }
  };

  // Open Link Modal for a specific group
  const handleOpenLinkModal = (group: any) => {
    setActiveGroupToLink(group);
    const linkedIds = mappings
      .filter((m) => String(m.addonGroupId) === String(group._id))
      .map((m) => String(m.menuItemId));
    setSelectedMenuItemIds(linkedIds);
    setDishSearch('');
    setShowLinkModal(true);
  };

  // Toggle item selection in link modal
  const handleToggleMenuItem = (itemId: string) => {
    setSelectedMenuItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  // Select all or clear all in link modal
  const handleSelectAllMenuItems = () => {
    if (selectedMenuItemIds.length === menuItems.length) {
      setSelectedMenuItemIds([]);
    } else {
      setSelectedMenuItemIds(menuItems.map((item) => String(item._id)));
    }
  };

  // Save Link assignments
  const handleSaveItemLinks = async () => {
    if (!activeGroupToLink) return;
    setSavingLinks(true);
    try {
      await foodService.linkAddonGroupToItems(activeGroupToLink._id, selectedMenuItemIds);
      setShowLinkModal(false);
      loadAddonData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save dish assignments');
    } finally {
      setSavingLinks(false);
    }
  };

  // Delete Addon Group
  const handleDeleteAddonGroup = async (groupId: string, groupTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete the "${groupTitle}" add-on group?`)) return;
    try {
      await foodService.deleteAddonGroup(groupId);
      loadAddonData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete add-on group');
    }
  };

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDishesForLinking = menuItems.filter((m) =>
    m.name.toLowerCase().includes(dishSearch.toLowerCase())
  );

  const filteredDishesForCreation = menuItems.filter((m) =>
    m.name.toLowerCase().includes(creationDishSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-slate-100 flex items-center space-x-2">
            <Sliders className="w-6 h-6 text-amber-400" />
            <span>Add-ons & Item Customisation Engine</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Create add-on groups like Extra Cheese, Spice Levels, Dips & Link them to specific Menu Items / Dishes
          </p>
        </div>

        {/* TOP TAB NAVIGATION */}
        <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => navigate('/menu/items')}
            className="px-4 py-2 font-bold rounded-xl text-xs transition text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            Dishes / Items
          </button>
          <button
            onClick={() => navigate('/menu/categories')}
            className="px-4 py-2 font-bold rounded-xl text-xs transition text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            Menu Categories
          </button>
          <button
            onClick={() => navigate('/menu/addons')}
            className="px-4 py-2 font-bold rounded-xl text-xs transition bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            Add-ons & Customisations
          </button>
        </div>
      </div>

      {/* SEARCH & ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search add-on groups by title..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center space-x-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Add-on Group</span>
        </button>
      </div>

      {/* ADD-ON GROUPS LIST */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">Loading add-on groups & item links...</div>
      ) : filteredGroups.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800 max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Sliders className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-200 text-base">No Add-on Groups Yet</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Allow customers to customize their dishes with extra toppings, spice preferences, or dip choices. Link add-ons to specific dishes!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg cursor-pointer"
          >
            + Create First Add-on Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((group) => {
            const groupOptions = items.filter((item) => String(item.addonGroupId) === String(group._id));
            const linkedDishIds = mappings
              .filter((m) => String(m.addonGroupId) === String(group._id))
              .map((m) => String(m.menuItemId));
            const linkedDishes = menuItems.filter((item) => linkedDishIds.includes(String(item._id)));

            return (
              <div key={group._id} className="glass-panel p-5 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                        <Sliders className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-100 font-heading">{group.name}</h3>
                        <span className="text-[10px] text-slate-400">
                          {group.required ? 'Mandatory Choice' : 'Optional Selection'} • Max {group.maxSelection || 1}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          group.required
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {group.required ? 'REQUIRED' : 'OPTIONAL'}
                      </span>
                      <button
                        onClick={() => handleDeleteAddonGroup(group._id, group.name)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        title="Delete Addon Group"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* ADDON OPTIONS LIST */}
                  <div className="mt-4 space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Add-on Options ({groupOptions.length})
                    </div>
                    {groupOptions.length === 0 ? (
                      <div className="text-xs text-slate-500 italic">No option items in this group.</div>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {groupOptions.map((opt) => (
                          <div
                            key={opt._id}
                            className="flex items-center justify-between p-2 bg-slate-900/80 rounded-xl border border-slate-800 text-xs"
                          >
                            <span className="text-slate-200 font-medium">{opt.name}</span>
                            <span className="text-amber-400 font-mono font-bold">
                              {opt.additionalPrice > 0 ? `+₹${opt.additionalPrice}` : 'FREE'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* LINKED MENU ITEMS DISPLAY */}
                  <div className="mt-4 pt-3 border-t border-slate-800/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                        <Utensils className="w-3 h-3 text-amber-400" />
                        <span>Assigned Dishes ({linkedDishes.length})</span>
                      </span>
                      <button
                        onClick={() => handleOpenLinkModal(group)}
                        className="text-[11px] text-amber-400 font-bold hover:underline flex items-center space-x-1 cursor-pointer bg-transparent border-none"
                      >
                        <Link className="w-3 h-3" />
                        <span>Assign to Items</span>
                      </button>
                    </div>

                    {linkedDishes.length === 0 ? (
                      <div className="text-xs text-slate-500 italic p-2 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-center">
                        Not linked to any dish yet.{' '}
                        <button
                          onClick={() => handleOpenLinkModal(group)}
                          className="text-amber-400 underline font-semibold bg-transparent border-none cursor-pointer"
                        >
                          Link Now
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {linkedDishes.map((dish) => (
                          <span
                            key={dish._id}
                            className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[11px] font-semibold text-slate-200 flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate max-w-[120px]">{dish.name}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Selection Range: {group.minSelection || 0} - {group.maxSelection || 1}</span>
                  <button
                    onClick={() => handleOpenLinkModal(group)}
                    className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold rounded-lg hover:bg-amber-500/20 transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Link className="w-3 h-3" />
                    <span>Manage Item Links</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE ADDON GROUP MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 w-full max-w-lg space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-100 font-heading">Create New Add-on Group</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAddonGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Add-on Group Title *</label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Extra Cheese & Toppings, Choice of Beverage, Spice Preference"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Selection Requirement</label>
                  <select
                    value={required ? 'YES' : 'NO'}
                    onChange={(e) => setRequired(e.target.value === 'YES')}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="NO">Optional Selection</option>
                    <option value="YES">Mandatory (Required)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Max Options Allowed</label>
                  <input
                    type="number"
                    min={1}
                    value={maxSelection}
                    onChange={(e) => setMaxSelection(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* DYNAMIC ADD-ON ITEMS ROWS */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-300">Add-on Options & Extra Price *</label>
                  <button
                    type="button"
                    onClick={handleAddOptionRow}
                    className="text-xs text-amber-400 font-bold hover:underline bg-transparent border-none cursor-pointer"
                  >
                    + Add Option Row
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {addonOptions.map((opt, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        required
                        value={opt.name}
                        onChange={(e) => handleOptionChange(index, 'name', e.target.value)}
                        placeholder="e.g. Extra Mozzarella Cheese"
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                      <div className="w-28 relative">
                        <span className="absolute left-2.5 top-2 text-xs text-slate-500 font-bold">₹</span>
                        <input
                          type="number"
                          min={0}
                          value={opt.additionalPrice}
                          onChange={(e) => handleOptionChange(index, 'additionalPrice', Number(e.target.value))}
                          placeholder="0"
                          className="w-full pl-6 pr-2 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>
                      {addonOptions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionRow(index)}
                          className="p-2 text-rose-400 hover:text-rose-300 bg-transparent border-none cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* DISH ASSIGNMENT IN CREATION MODAL */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Assign to Menu Items / Dishes ({selectedCreationItemIds.length} Selected)
                </label>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={creationDishSearch}
                    onChange={(e) => setCreationDishSearch(e.target.value)}
                    placeholder="Search dishes to assign..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-slate-800 rounded-xl p-2 bg-slate-900/60">
                  {filteredDishesForCreation.length === 0 ? (
                    <div className="text-xs text-slate-500 text-center py-3">
                      No dishes found.{' '}
                      <button
                        type="button"
                        onClick={() => navigate('/menu/items')}
                        className="text-amber-400 font-bold underline bg-transparent border-none cursor-pointer"
                      >
                        + Add Dishes in Menu
                      </button>
                    </div>
                  ) : (
                    filteredDishesForCreation.map((dish) => {
                      const isSelected = selectedCreationItemIds.includes(String(dish._id));
                      return (
                        <div
                          key={dish._id}
                          onClick={() => {
                            const idStr = String(dish._id);
                            setSelectedCreationItemIds((prev) =>
                              prev.includes(idStr) ? prev.filter((id) => id !== idStr) : [...prev, idStr]
                            );
                          }}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition ${
                            isSelected ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {isSelected ? <CheckSquare className="w-4 h-4 text-amber-400" /> : <Square className="w-4 h-4 text-slate-600" />}
                            <span className="font-medium">{dish.name}</span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">₹{dish.basePrice}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-900 text-slate-400 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md">
                  Save & Create Add-on Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN / LINK ADDON GROUP TO ITEMS MODAL */}
      {showLinkModal && activeGroupToLink && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 w-full max-w-lg space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                  <Link className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-100 font-heading">
                    Assign Add-ons: {activeGroupToLink.name}
                  </h2>
                  <p className="text-xs text-slate-400">Select which menu items/dishes will offer this add-on group</p>
                </div>
              </div>

              <button onClick={() => setShowLinkModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SEARCH & SELECT ALL */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={dishSearch}
                  onChange={(e) => setDishSearch(e.target.value)}
                  placeholder="Search dish by name..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="button"
                onClick={handleSelectAllMenuItems}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 font-bold text-xs rounded-xl shrink-0 cursor-pointer"
              >
                {selectedMenuItemIds.length === menuItems.length ? 'Deselect All' : 'Select All Dishes'}
              </button>
            </div>

            {/* DISHES SELECTION LIST */}
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {filteredDishesForLinking.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">No menu items found.</div>
              ) : (
                filteredDishesForLinking.map((dish) => {
                  const idStr = String(dish._id);
                  const isChecked = selectedMenuItemIds.includes(idStr);

                  return (
                    <div
                      key={dish._id}
                      onClick={() => handleToggleMenuItem(idStr)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${
                        isChecked
                          ? 'bg-amber-500/10 border-amber-500/40 text-slate-100'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-1 rounded-lg ${isChecked ? 'text-amber-400' : 'text-slate-600'}`}>
                          {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-200">{dish.name}</div>
                          <div className="text-[10px] text-slate-500">Base Price: ₹{dish.basePrice}</div>
                        </div>
                      </div>

                      {isChecked && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          LINKED
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">
                {selectedMenuItemIds.length} dish(es) selected
              </span>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 bg-slate-900 text-slate-400 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingLinks}
                  onClick={handleSaveItemLinks}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5"
                >
                  {savingLinks ? (
                    <span>Saving Links...</span>
                  ) : (
                    <>
                      <span>Save Item Assignments</span>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
