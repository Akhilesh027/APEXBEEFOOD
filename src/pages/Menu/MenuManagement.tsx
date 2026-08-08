import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  Tag,
  Flame,
  CheckCircle2,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
  UtensilsCrossed,
  Clock,
  ArrowUpDown,
  Power,
} from 'lucide-react';
import { foodService } from '../../services/foodService';
import { IFoodMenuItem, IFoodMenuCategory } from '../../types/foodPartner';

export const MenuManagement: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isCategoriesRoute = location.pathname.includes('/menu/categories');
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>(isCategoriesRoute ? 'categories' : 'items');

  useEffect(() => {
    setActiveTab(location.pathname.includes('/menu/categories') ? 'categories' : 'items');
  }, [location.pathname]);

  const handleTabSwitch = (tab: 'items' | 'categories') => {
    setActiveTab(tab);
    if (tab === 'categories') {
      navigate('/menu/categories');
    } else {
      navigate('/menu/items');
    }
  };

  const [categories, setCategories] = useState<IFoodMenuCategory[]>([]);
  const [items, setItems] = useState<IFoodMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Modals state
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<IFoodMenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<IFoodMenuCategory | null>(null);

  const [uploadingItemImage, setUploadingItemImage] = useState(false);

  const handleItemImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingItemImage(true);
    try {
      const res = await foodService.uploadImage(file);
      if (res?.url) {
        setNewItemData((prev) => ({ ...prev, imageUrl: res.url }));
      }
    } catch (err) {
      alert('Failed to upload food dish image');
    } finally {
      setUploadingItemImage(false);
    }
  };

  // New Item Form
  const [newItemData, setNewItemData] = useState({
    name: '',
    categoryId: '',
    description: '',
    foodType: 'VEG' as 'VEG' | 'NON_VEG' | 'EGG' | 'VEGAN',
    basePrice: 199,
    offerPrice: 0,
    preparationTimeMinutes: 20,
    isBestseller: false,
    isRecommended: false,
    imageUrl: '',
  });

  // Category Form
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    sortOrder: 0,
    isActive: true,
  });

  const loadMenuData = async () => {
    setLoading(true);
    try {
      const [catRes, itemRes] = await Promise.all([
        foodService.getCategories(),
        foodService.getMenuItems(),
      ]);

      let loadedCats = catRes.data?.categories || [];
      
      // Auto-create default category if completely empty
      if (loadedCats.length === 0) {
        try {
          const defaultCatRes = await foodService.createCategory({
            name: 'Main Course',
            description: 'Popular main course delicacies and chef specials',
            sortOrder: 1,
          });
          if (defaultCatRes.data?.category) {
            loadedCats = [defaultCatRes.data.category];
          }
        } catch {
          /* ignore auto seed error */
        }
      }

      setCategories(loadedCats);
      if (loadedCats.length > 0 && !newItemData.categoryId) {
        setNewItemData((prev) => ({ ...prev, categoryId: loadedCats[0]._id }));
      }

      if (itemRes.data?.items) {
        setItems(itemRes.data.items);
      }
    } catch (err) {
      console.error('Failed to load menu data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenuData();
  }, []);

  // Category Actions
  const handleOpenCategoryModal = (cat?: IFoodMenuCategory) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryFormData({
        name: cat.name,
        description: cat.description || '',
        sortOrder: cat.sortOrder || 0,
        isActive: cat.isActive ?? true,
      });
    } else {
      setEditingCategory(null);
      setCategoryFormData({
        name: '',
        description: '',
        sortOrder: categories.length + 1,
        isActive: true,
      });
    }
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name) return;

    try {
      if (editingCategory) {
        await foodService.updateCategory(editingCategory._id, categoryFormData);
      } else {
        await foodService.createCategory(categoryFormData);
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      loadMenuData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleToggleCategoryActive = async (cat: IFoodMenuCategory) => {
    try {
      await foodService.updateCategory(cat._id, { isActive: !cat.isActive });
      loadMenuData();
    } catch (err) {
      alert('Failed to toggle category status');
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    const itemCount = items.filter(
      (item) => (item.categoryId as any)?._id === catId || item.categoryId === catId
    ).length;

    if (itemCount > 0) {
      if (!window.confirm(`This category contains ${itemCount} food item(s). Deleting it will disassociate these items. Continue?`)) {
        return;
      }
    } else {
      if (!window.confirm('Are you sure you want to delete this category?')) return;
    }

    try {
      await foodService.deleteCategory(catId);
      loadMenuData();
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  // Item Actions
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemData.name || !newItemData.categoryId) {
      alert('Please enter Item Name and select a Category');
      return;
    }

    try {
      const payload = {
        ...newItemData,
        image: newItemData.imageUrl,
        imageUrl: newItemData.imageUrl,
      };
      if (editingItem) {
        await foodService.updateMenuItem(editingItem._id, payload);
      } else {
        await foodService.createMenuItem(payload);
      }
      setShowItemModal(false);
      setEditingItem(null);
      setNewItemData({
        name: '',
        categoryId: categories[0]?._id || '',
        description: '',
        foodType: 'VEG',
        basePrice: 199,
        offerPrice: 0,
        preparationTimeMinutes: 20,
        isBestseller: false,
        isRecommended: false,
        imageUrl: '',
      });
      loadMenuData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save menu item');
    }
  };

  const handleEditItemClick = (item: IFoodMenuItem) => {
    setEditingItem(item);
    setNewItemData({
      name: item.name,
      categoryId: typeof item.categoryId === 'object' ? (item.categoryId as any)._id : item.categoryId,
      description: item.description || '',
      foodType: item.foodType,
      basePrice: item.basePrice,
      offerPrice: item.offerPrice || 0,
      preparationTimeMinutes: item.preparationTimeMinutes || 20,
      isBestseller: item.isBestseller || false,
      isRecommended: item.isRecommended || false,
      imageUrl: item.imageUrl || item.image || '',
    });
    setShowItemModal(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await foodService.deleteMenuItem(itemId);
      loadMenuData();
    } catch (err) {
      alert('Failed to delete menu item');
    }
  };

  const handleToggleSoldOut = async (itemId: string, currentSoldOut: boolean) => {
    try {
      await foodService.toggleSoldOut(itemId, !currentSoldOut);
      loadMenuData();
    } catch (err) {
      alert('Failed to toggle sold out status');
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !selectedCategory || (item.categoryId as any)?._id === selectedCategory || item.categoryId === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-slate-100 flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-amber-400" />
            <span>Restaurant Menu & Category Engine</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage food categories, dish items, pricing, veg/non-veg tags & instant availability
          </p>
        </div>

        {/* TOP TAB TOGGLE */}
        <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => handleTabSwitch('items')}
            className={`px-4 py-2 font-bold rounded-xl text-xs transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'items'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Dishes / Items ({items.length})</span>
          </button>
          <button
            onClick={() => handleTabSwitch('categories')}
            className={`px-4 py-2 font-bold rounded-xl text-xs transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Menu Categories ({categories.length})</span>
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
            placeholder={activeTab === 'categories' ? 'Search categories...' : 'Search menu items by name...'}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {activeTab === 'items' ? (
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                !selectedCategory ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All ({items.length})
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                onClick={() => setSelectedCategory(c._id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === c._id ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {c.name}
              </button>
            ))}
            <button
              onClick={() => {
                setEditingItem(null);
                setNewItemData({
                  name: '',
                  categoryId: categories[0]?._id || '',
                  description: '',
                  foodType: 'VEG',
                  basePrice: 199,
                  offerPrice: 0,
                  preparationTimeMinutes: 20,
                  isBestseller: false,
                  isRecommended: false,
                  imageUrl: '',
                });
                setShowItemModal(true);
              }}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-md whitespace-nowrap cursor-pointer"
            >
              + Add Dish
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleOpenCategoryModal()}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center space-x-2 cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Category</span>
          </button>
        )}
      </div>

      {/* CATEGORIES TAB VIEW */}
      {activeTab === 'categories' && (
        <>
          {loading ? (
            <div className="text-center py-16 text-slate-400 text-xs">Loading food categories...</div>
          ) : filteredCategories.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800 max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-200 text-base">No Menu Categories Found</h3>
              <p className="text-xs text-slate-400">Create menu categories like Biryani, Starters, Main Course, or Desserts.</p>
              <button
                onClick={() => handleOpenCategoryModal()}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg cursor-pointer"
              >
                + Add First Category
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((cat) => {
                const itemCount = items.filter(
                  (item) => (item.categoryId as any)?._id === cat._id || item.categoryId === cat._id
                ).length;

                return (
                  <div key={cat._id} className="glass-panel p-5 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-sm text-slate-100 font-heading">{cat.name}</h3>
                            <span className="text-[10px] text-slate-500 font-mono font-semibold">Order #{cat.sortOrder || 0}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleCategoryActive(cat)}
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border transition flex items-center space-x-1 cursor-pointer ${
                            cat.isActive !== false
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{cat.isActive !== false ? 'ACTIVE' : 'INACTIVE'}</span>
                        </button>
                      </div>

                      <p className="text-xs text-slate-400 mt-3 line-clamp-2">{cat.description || 'No category description provided.'}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
                        <span>{itemCount} Food Item{itemCount === 1 ? '' : 's'}</span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleOpenCategoryModal(cat)}
                          className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat._id)}
                          className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* DISHES TAB VIEW */}
      {activeTab === 'items' && (
        <>
          {loading ? (
            <div className="text-center py-16 text-slate-400 text-xs">Loading restaurant menu...</div>
          ) : filteredItems.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800 max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-200 text-base">No Menu Items Found</h3>
              <p className="text-xs text-slate-400">Add signature dishes, starters, or beverages to start accepting orders.</p>
              <button
                onClick={() => setShowItemModal(true)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg cursor-pointer"
              >
                + Add First Dish
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const comm = item.platformCommissionPercent || 12;
                const platformShare = item.platformShareAmount || Math.round((item.basePrice * comm) / 100);
                const vendorPayout = item.vendorPayoutAmount || (item.basePrice - platformShare);
                const isPendingAdmin = item.approvalStatus === 'PENDING_ADMIN_REVIEW';
                const isPendingRestaurant = item.approvalStatus === 'PENDING_RESTAURANT_ACCEPTANCE';
                const isLive = item.approvalStatus === 'PUBLISHED_LIVE' || item.status === 'ACTIVE';
                const dishImg = item.imageUrl || item.image;

                return (
                  <div key={item._id} className="glass-panel p-5 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4">
                    <div>
                      {/* DISH IMAGE PREVIEW */}
                      <div className="w-full h-36 rounded-2xl overflow-hidden mb-3 bg-slate-950 border border-slate-800/80 relative">
                        {dishImg ? (
                          <img
                            src={dishImg}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e: any) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs font-semibold space-y-1">
                            <UtensilsCrossed className="w-6 h-6 text-slate-600" />
                            <span>No Dish Image Uploaded</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {/* VEG / NON-VEG BADGE */}
                          <span
                            className={`w-4 h-4 rounded-md border flex items-center justify-center p-0.5 ${
                              item.foodType === 'VEG' || item.foodType === 'VEGAN'
                                ? 'border-emerald-500'
                                : item.foodType === 'EGG'
                                ? 'border-amber-500'
                                : 'border-rose-500'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                item.foodType === 'VEG' || item.foodType === 'VEGAN'
                                  ? 'bg-emerald-500'
                                  : item.foodType === 'EGG'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                          </span>

                          <h3 className="font-bold text-sm text-slate-100 font-heading">{item.name}</h3>
                        </div>

                        <button
                          onClick={() => handleToggleSoldOut(item._id, item.soldOut)}
                          title="Toggle Sold Out State"
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border transition flex items-center space-x-1 cursor-pointer ${
                            item.soldOut
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          <span>{item.soldOut ? 'SOLD OUT' : 'AVAILABLE'}</span>
                        </button>
                      </div>

                      <p className="text-xs text-slate-400 mt-2 line-clamp-2">{item.description || 'No description provided.'}</p>

                      <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px]">
                        {item.isBestseller && (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold rounded-full border border-amber-500/30 flex items-center space-x-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Bestseller</span>
                          </span>
                        )}
                        <span className="text-slate-400 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{item.preparationTimeMinutes || 20}m</span>
                        </span>
                      </div>

                      {/* APPROVAL & COMMISSION STATUS BANNER */}
                      <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-2">
                        {isPendingAdmin && (
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 font-bold flex items-center space-x-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>⏳ Pending Admin Commission Setup</span>
                          </div>
                        )}

                        {isPendingRestaurant && (
                          <div className="p-3 bg-slate-950 border border-emerald-500/40 rounded-2xl space-y-2">
                            <div className="text-[11px] font-bold text-slate-200">
                              ⚡ Admin Proposed <strong className="text-purple-400">{comm}% Platform Commission</strong> (₹{platformShare}). Your net payout: <strong className="text-emerald-400">₹{vendorPayout}</strong>.
                            </div>
                            <button
                              onClick={async () => {
                                try {
                                  await foodService.respondToCommissionOffer(item._id, 'ACCEPT');
                                  alert('✅ Commission accepted! Dish is now Live on Platform.');
                                  loadMenuData();
                                } catch (err) {
                                  alert('Failed to accept commission offer');
                                }
                              }}
                              className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition cursor-pointer"
                            >
                              Accept Commission &amp; Publish Live
                            </button>
                          </div>
                        )}

                        {isLive && (
                          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-400 font-bold flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Live on Platform</span>
                            </div>
                            <span className="font-mono text-[10px] text-slate-400 font-semibold">{comm}% Comm | Payout ₹{vendorPayout}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold">PRICE</div>
                        <div className="text-base font-extrabold text-amber-400 font-mono">
                          ₹{item.offerPrice || item.basePrice}
                          {(item.offerPrice ?? 0) > 0 && (item.offerPrice ?? 0) < item.basePrice && (
                            <span className="text-xs text-slate-500 line-through ml-1.5 font-normal">₹{item.basePrice}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleEditItemClick(item)}
                          className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition cursor-pointer"
                          title="Edit Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item._id)}
                          className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* CREATE / EDIT CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-slate-100 font-heading">
              {editingCategory ? 'Edit Menu Category' : 'Add Food Menu Category'}
            </h2>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="e.g. Hyderabadi Biryani, Starters, Beverages"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Display Sort Order</label>
                <input
                  type="number"
                  value={categoryFormData.sortOrder}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, sortOrder: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  placeholder="Category description"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 bg-slate-900 text-slate-400 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md">
                  {editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MENU ITEM MODAL */}
      {showItemModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 w-full max-w-lg space-y-4 my-8">
            <h2 className="text-lg font-bold text-slate-100 font-heading">
              {editingItem ? 'Edit Food Menu Item' : 'Add New Food Menu Item'}
            </h2>
            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Item / Dish Name *</label>
                <input
                  type="text"
                  required
                  value={newItemData.name}
                  onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
                  placeholder="e.g. Chicken Dum Biryani, Paneer Butter Masala"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Menu Category *</label>
                  <select
                    required
                    value={newItemData.categoryId}
                    onChange={(e) => setNewItemData({ ...newItemData, categoryId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Dietary Tag *</label>
                  <select
                    value={newItemData.foodType}
                    onChange={(e) => setNewItemData({ ...newItemData, foodType: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="VEG">Pure Veg</option>
                    <option value="NON_VEG">Non-Veg</option>
                    <option value="EGG">Egg</option>
                    <option value="VEGAN">Vegan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newItemData.basePrice}
                    onChange={(e) => setNewItemData({ ...newItemData, basePrice: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Offer Price (₹)</label>
                  <input
                    type="number"
                    value={newItemData.offerPrice}
                    onChange={(e) => setNewItemData({ ...newItemData, offerPrice: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Prep Time (Mins)</label>
                  <input
                    type="number"
                    required
                    value={newItemData.preparationTimeMinutes}
                    onChange={(e) => setNewItemData({ ...newItemData, preparationTimeMinutes: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Upload Food Dish Image</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleItemImageUpload}
                    className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                  />
                  {uploadingItemImage && <span className="text-[11px] text-amber-400 font-bold animate-pulse">Uploading Image...</span>}
                </div>
                <input
                  type="text"
                  value={newItemData.imageUrl}
                  onChange={(e) => setNewItemData({ ...newItemData, imageUrl: e.target.value })}
                  placeholder="Or enter direct Image URL (https://...)"
                  className="w-full mt-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Item Description</label>
                <textarea
                  rows={2}
                  value={newItemData.description}
                  onChange={(e) => setNewItemData({ ...newItemData, description: e.target.value })}
                  placeholder="Rich aromatic basmati rice cooked with tender marinated chicken..."
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center space-x-6 pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newItemData.isBestseller}
                    onChange={(e) => setNewItemData({ ...newItemData, isBestseller: e.target.checked })}
                    className="rounded text-amber-500 bg-slate-900 border-slate-800 focus:ring-0"
                  />
                  <span>Mark as Bestseller</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newItemData.isRecommended}
                    onChange={(e) => setNewItemData({ ...newItemData, isRecommended: e.target.checked })}
                    className="rounded text-amber-500 bg-slate-900 border-slate-800 focus:ring-0"
                  />
                  <span>Chef Recommended</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowItemModal(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 bg-slate-900 text-slate-400 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md">
                  {editingItem ? 'Update Dish' : 'Publish Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
