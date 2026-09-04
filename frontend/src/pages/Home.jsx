import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Sofa, Refrigerator, LayoutGrid, MapPin, ArrowUpRight, Loader2, Sparkles } from 'lucide-react';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'All') {
        params.append('category', selectedCategory);
      }
      if (searchQuery) params.append('search', searchQuery);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);

      const response = await api.get(`/api/products?${params.toString()}`);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const categories = [
    { name: 'All', icon: <LayoutGrid className="w-4 h-4" /> },
    { name: 'Furniture', icon: <Sofa className="w-4 h-4" /> },
    { name: 'Appliances', icon: <Refrigerator className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-32 font-sans overflow-x-hidden">
      
      {/* 🌌 ULTRA-LUXURY HERO SECTION (Height Reduced!) */}
      <div className="relative bg-zinc-950 pt-16 pb-24 overflow-hidden flex items-center justify-center text-center">
        {/* Ambient Gold Glow (Scaled down slightly for the shorter height) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/15 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 mt-4">
          <div className="inline-flex items-center space-x-2 bg-zinc-900/50 backdrop-blur-md border border-zinc-800 text-amber-400 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6 shadow-2xl">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Premium Rentals</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-5 leading-tight">
            Curated living. <br />
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-600 bg-clip-text text-transparent">
              Redefined.
            </span>
          </h1>
          <p className="text-lg text-zinc-400 font-light max-w-2xl mx-auto">
            Experience the ultimate in flexibility. High-end furniture and appliances, delivered seamlessly to your sanctuary.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        
        {/* 🎛️ FROSTED GLASS FILTER BAR */}
        <div className="bg-white/70 backdrop-blur-xl p-2 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/80 flex flex-wrap justify-center gap-2 mb-8 max-w-fit mx-auto">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`flex items-center space-x-2 px-8 py-3 rounded-xl text-sm font-bold transition-all duration-500 ${
                selectedCategory === cat.name
                  ? 'bg-zinc-950 text-white shadow-lg scale-105'
                  : 'bg-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              {cat.icon}
              <span className="tracking-wide">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* 🔍 SEARCH & PRICE FILTERS */}
        <form onSubmit={handleSearchSubmit} className="max-w-4xl mx-auto mb-12 flex flex-col sm:flex-row gap-4 items-center justify-center">
          <div className="w-full sm:w-1/2">
            <input 
              type="text" 
              placeholder="Search pieces..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3 rounded-xl bg-white border border-zinc-200 focus:outline-none focus:border-amber-500 transition-colors shadow-sm"
            />
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            <input 
              type="number" 
              placeholder="Min ₹" 
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-24 px-4 py-3 rounded-xl bg-white border border-zinc-200 focus:outline-none focus:border-amber-500 transition-colors shadow-sm"
            />
            <input 
              type="number" 
              placeholder="Max ₹" 
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-24 px-4 py-3 rounded-xl bg-white border border-zinc-200 focus:outline-none focus:border-amber-500 transition-colors shadow-sm"
            />
            <button 
              type="submit"
              className="px-6 py-3 bg-amber-500 text-zinc-950 rounded-xl font-bold hover:bg-amber-400 transition-colors shadow-md"
            >
              Apply
            </button>
          </div>
        </form>

        {/* 📦 LOADING STATE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-pulse">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
            <p className="text-zinc-400 font-medium tracking-widest uppercase text-xs">Curating Collection...</p>
          </div>
        ) : (
          
          /* 💎 DYNAMIC PRODUCT GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <Link 
                to={`/product/${product._id}`} 
                key={product._id} 
                className="group relative bg-white rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-zinc-100 flex flex-col"
              >
                {/* Tall, Elegant Image Container */}
                <div className="relative h-72 overflow-hidden bg-zinc-50">
                  <img 
                    src={product.image} 
                    alt={product.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                    loading="lazy"
                  />
                  {/* Subtle Gradient Overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Floating Category Badge */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black text-zinc-900 uppercase tracking-widest shadow-lg">
                    {product.category}
                  </div>
                </div>
                
                {/* Refined Content Container */}
                <div className="p-5 flex-1 flex flex-col relative z-10 bg-white">
                  <h3 className="text-lg font-bold text-zinc-900 leading-tight capitalize mb-2">{product.title}</h3>
                  
                  {product.subCategory && (
                    <p className="text-zinc-500 text-xs mb-5 flex items-center font-medium">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> 
                      {product.subCategory}
                    </p>
                  )}
                  
                  <div className="mt-auto pt-4 border-t border-zinc-100 flex justify-between items-end">
                    <div>
                      <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1">Monthly Lease</p>
                      <p className="text-xl font-black text-zinc-900">${product.monthlyRent}<span className="text-xs text-zinc-400 font-medium tracking-normal">/mo</span></p>
                    </div>
                    
                    {/* Animated "Arrow" Button */}
                    <div className="flex items-center justify-center w-9 h-9 rounded-full border border-zinc-200 bg-white group-hover:bg-zinc-950 group-hover:border-zinc-950 transition-all duration-500 shadow-sm">
                      <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-white group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && products.length === 0 && (
          <div className="text-center py-32 bg-white rounded-[2rem] border border-dashed border-zinc-200 shadow-sm">
            <Sparkles className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-zinc-900 mb-2 tracking-tight">The vault is currently empty</h3>
            <p className="text-zinc-500 font-medium text-sm">We are preparing new {selectedCategory.toLowerCase()} pieces for you.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
