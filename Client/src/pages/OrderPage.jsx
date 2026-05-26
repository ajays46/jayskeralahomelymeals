import React, { useEffect, useMemo, useState } from 'react';
import { MdLocalFireDepartment } from 'react-icons/md';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useCompanyBasePath, useTenant } from '../context/TenantContext';
import { getThemeForCompany } from '../config/tenantThemes';
import { useMenusForBooking, useProductList } from '../hooks/adminHook/adminHook';
import { useAddress } from '../hooks/userHooks/userAddress';

const fallbackImages = ['/hero/heroo.png', '/JLG.png', '/hero/heroo.png', '/JLG.png'];
const fallbackThumb = '/logo.png';

const getApiOrigin = () => {
  const apiBase =
    import.meta.env.VITE_NODE_ENV === 'development'
      ? import.meta.env.VITE_DEV_API_URL
      : import.meta.env.VITE_PROD_API_URL;
  if (!apiBase) return '';
  return String(apiBase).replace(/\/api\/?$/, '').replace(/\/+$/, '');
};

const resolveImageSrc = (url, fallback = fallbackThumb) => {
  if (!url) return fallback;
  const raw = String(url).trim();
  if (!raw) return fallback;
  if (raw.startsWith('data:image/')) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/')) {
    const origin = getApiOrigin();
    return origin ? `${origin}${raw}` : raw;
  }
  return raw;
};

const isAddonProduct = (product) => {
  const directCategory = String(
    product?.category || product?.productCategory || product?.categoryName || ''
  ).toUpperCase();
  if (directCategory === 'ADD_ON') return true;

  const categories = Array.isArray(product?.categories) ? product.categories : [];
  return categories.some((cat) =>
    String(cat?.productCategoryName || cat?.name || cat?.category || '').toUpperCase() === 'ADD_ON'
  );
};

const formatAddressDisplay = (address) => {
  if (!address) return '';
  if (address.googleMapsUrl && !address.street) return 'Saved map location';
  const parts = [address.housename, address.street, address.city].filter(Boolean);
  const pin = address.pincode ? ` - ${address.pincode}` : '';
  return `${parts.join(', ')}${pin}`.trim();
};

const OrderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tenant = useTenant();
  const basePath = useCompanyBasePath();
  const companyId = tenant?.companyId ?? null;
  const theme = tenant?.theme ?? getThemeForCompany(tenant?.companyPath, tenant?.companyName);
  const accent = theme?.accentColor || theme?.primaryColor || '#FE8C00';

  const { data: menusData, isLoading } = useMenusForBooking(companyId);
  const { data: productListData, isLoading: isLoadingProducts } = useProductList();
  const { addresses: userAddresses, isLoadingAddresses } = useAddress();

  const [quantities, setQuantities] = useState({});
  const [selectedAddonKeys, setSelectedAddonKeys] = useState([]);
  const [addonQuantities, setAddonQuantities] = useState({});
  const [selectedItemId, setSelectedItemId] = useState('');

  const menuItems = useMemo(() => (Array.isArray(menusData?.data) ? menusData.data : []), [menusData]);
  const products = useMemo(() => {
    const rawProducts = Array.isArray(productListData?.data) ? productListData.data : [];
    return rawProducts.filter((product) => String(product?.status || '').toUpperCase() === 'ACTIVE');
  }, [productListData]);
  const mainItems = useMemo(() => menuItems, [menuItems]);
  const orderedMainItems = useMemo(() => {
    const score = (item) => {
      const text = `${item?.name || ''} ${item?.product?.productName || ''}`.toLowerCase();
      if (text.includes('veg lunch') || text.includes('today')) return 3;
      if (text.includes('lunch') || text.includes('veg')) return 2;
      return 1;
    };
    return [...mainItems].sort((a, b) => score(b) - score(a));
  }, [mainItems]);
  const separateAddonOptions = useMemo(() => {
    const mappedProductAddons = products
      .filter(isAddonProduct)
      .map((product) => ({
      key: `product:${product.id}`,
      id: product.id,
      name: product.productName,
      price: Number(product?.prices?.[0]?.price || 0),
      imageUrl: product?.imageUrl || '',
      source: 'product',
    }));
    const merged = [...mappedProductAddons];
    const seen = new Set();
    return merged
      .filter((addon) => {
        const normalizedName = String(addon.name || '').trim().toLowerCase();
        if (!normalizedName) return false;
        if (seen.has(normalizedName)) return false;
        seen.add(normalizedName);
        return true;
      })
      .sort((a, b) => a.price - b.price)
      .slice(0, 12);
  }, [products]);
  const hasStateAddress = Boolean(location.state?.prefilledAddressId);
  const hasSavedAddress = Array.isArray(userAddresses) && userAddresses.length > 0;
  const currentAddressDisplay = useMemo(() => {
    const stateDisplay = String(location.state?.prefilledAddressDisplay || '').trim();
    if (stateDisplay) return stateDisplay;

    const stateAddressId = location.state?.prefilledAddressId;
    if (stateAddressId && Array.isArray(userAddresses) && userAddresses.length > 0) {
      const matchedAddress = userAddresses.find((address) => address?.id === stateAddressId);
      const matchedDisplay = formatAddressDisplay(matchedAddress);
      if (matchedDisplay) return matchedDisplay;
    }

    if (!hasSavedAddress) return '';
    return formatAddressDisplay(userAddresses[0]);
  }, [location.state?.prefilledAddressDisplay, location.state?.prefilledAddressId, hasSavedAddress, userAddresses]);
  const currentAddressId = useMemo(() => {
    const stateAddressId = String(location.state?.prefilledAddressId || '').trim();
    if (stateAddressId) return stateAddressId;
    if (!hasSavedAddress) return '';
    return String(userAddresses[0]?.id || '').trim();
  }, [location.state?.prefilledAddressId, hasSavedAddress, userAddresses]);

  useEffect(() => {
    if (isLoadingAddresses) return;
    if (!hasStateAddress && !hasSavedAddress) {
      navigate(`${basePath}/order-address`, { replace: true });
    }
  }, [isLoadingAddresses, hasStateAddress, hasSavedAddress, navigate, basePath]);

  useEffect(() => {
    if (!selectedItemId && orderedMainItems.length > 0) {
      setSelectedItemId(orderedMainItems[0].id);
    }
  }, [selectedItemId, orderedMainItems]);

  const getQuantity = (itemId) => Math.max(1, quantities[itemId] || 1);

  const updateQuantity = (itemId, direction) => {
    setSelectedItemId(itemId);
    setQuantities((prev) => {
      const current = Math.max(1, prev[itemId] || 1);
      const next = direction === 'inc' ? current + 1 : Math.max(1, current - 1);
      return { ...prev, [itemId]: next };
    });
  };

  const toggleAddon = (addonKey) => {
    setSelectedAddonKeys((prev) =>
      prev.includes(addonKey) ? prev.filter((id) => id !== addonKey) : [...prev, addonKey]
    );
  };

  const getAddonQuantity = (addonKey) => Math.max(1, addonQuantities[addonKey] || 1);

  const updateAddonQuantity = (addonKey, direction) => {
    setSelectedAddonKeys((prev) => (prev.includes(addonKey) ? prev : [...prev, addonKey]));
    setAddonQuantities((prev) => {
      const current = Math.max(1, prev[addonKey] || 1);
      const next = direction === 'inc' ? current + 1 : Math.max(1, current - 1);
      return { ...prev, [addonKey]: next };
    });
  };

  const selectedAddons = useMemo(
    () =>
      separateAddonOptions
        .filter((addon) => selectedAddonKeys.includes(addon.key))
        .map((addon) => ({ ...addon, quantity: getAddonQuantity(addon.key) })),
    [separateAddonOptions, selectedAddonKeys, addonQuantities]
  );

  const getAddonsTotal = () =>
    selectedAddons.reduce((sum, addon) => sum + Number(addon.price || 0) * Number(addon.quantity || 1), 0);

  const getMealTotal = (item) => Number(item.price || 0) * getQuantity(item.id);

  const getTotalPrice = (item) => getMealTotal(item) + getAddonsTotal();

  const handleOrder = (item) => {
    setSelectedItemId(item.id);
    if (!hasStateAddress && !hasSavedAddress) {
      navigate(`${basePath}/order-address`);
      return;
    }
    const orderAddons = selectedAddons.map((addon) => ({
      id: addon.id,
      name: addon.name,
      price: addon.price || 0,
      quantity: addon.quantity || 1,
    }));
    navigate(`${basePath}/place-order`, {
      state: {
        initialTab: 'menu',
        skipToMenuSelection: true,
        prefilledAddressId: location.state?.prefilledAddressId,
        prefilledAddressDisplay: location.state?.prefilledAddressDisplay,
        prefilledCustomerName: location.state?.prefilledCustomerName,
        selectedMenuFromOrder: item,
        menuQuantityFromOrder: getQuantity(item.id),
        selectedAddonsFromOrder: orderAddons,
      },
    });
  };

  const selectedItem = useMemo(
    () => orderedMainItems.find((item) => item.id === selectedItemId) || null,
    [orderedMainItems, selectedItemId]
  );
  const showAddressCard = hasStateAddress || hasSavedAddress;

  return (
    <div className="min-h-screen bg-[#f6f1e7]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Navbar minimalNav />
      <main className="pt-16 sm:pt-[72px] pb-8">
        <section className="px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mt-2 flex items-start justify-between gap-4">
              <div>
                <h2 className="inline-flex items-center gap-2 text-2xl font-black text-[#1f2e2a]">
                  <MdLocalFireDepartment className="text-[#ff6c3b]" />
                  Trending Now
                </h2>
              </div>
              {showAddressCard && (
                <div className="hidden w-full max-w-sm rounded-2xl border border-[#ddd8cc] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] lg:block">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#6f6c64]">Delivery Address</p>
                      <p className="mt-1 text-sm font-medium text-[#1f2e2a]">
                        {currentAddressDisplay || (isLoadingAddresses ? 'Loading saved address...' : 'Saved address available')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`${basePath}/order-address`, {
                          state: {
                            editAddressId: currentAddressId || undefined,
                            prefilledCustomerName: location.state?.prefilledCustomerName,
                          },
                        })
                      }
                      className="rounded-lg border border-[#1f6f5f] px-3 py-1.5 text-xs font-semibold text-[#1f6f5f] transition hover:bg-[#eef7f4]"
                    >
                      Edit Address
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="h-72 animate-pulse rounded-2xl border border-[#e5dfd2] bg-white" />
                  ))}
                </div>
              ) : orderedMainItems.length ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {orderedMainItems.map((item, index) => {
                    const titleText = item.product?.productName || item.name || 'Menu Item';
                    const isSelected = selectedItemId === item.id;
                    return (
                      <article
                        key={item.id}
                        onClick={() => {
                          setSelectedItemId(item.id);
                        }}
                        className={`overflow-hidden rounded-2xl border bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] ${
                          isSelected ? 'border-[#1f6f5f]' : 'border-[#ddd8cc]'
                        }`}
                      >
                        <div className="relative h-44 w-full bg-[#ece7dc]">
                          <img
                            src={resolveImageSrc(item?.product?.imageUrl, fallbackImages[index % fallbackImages.length])}
                            alt={item.name || 'Menu item'}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.src = fallbackImages[index % fallbackImages.length];
                            }}
                          />
                        </div>

                        <div className="p-4">
                          <div className="mt-1 flex items-start justify-between gap-3">
                            <div>
                              <h3 className="line-clamp-1 text-lg font-extrabold text-[#1f2e2a]">{titleText}</h3>
                              <p className="mt-2 text-2xl font-black" style={{ color: accent }}>
                                ₹{item.price || 0}
                              </p>
                            </div>
                            <div className="inline-flex items-center rounded-xl border border-[#d5d0c3] bg-[#f8f5ee]">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, 'dec')}
                                className="h-10 w-10 text-lg font-bold text-[#2a5f54]"
                                aria-label={`Decrease quantity for ${item.name}`}
                              >
                                -
                              </button>
                              <span className="min-w-10 text-center text-base font-bold text-[#1f2e2a]">
                                {getQuantity(item.id)}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, 'inc')}
                                className="h-10 w-10 text-lg font-bold text-[#2a5f54]"
                                aria-label={`Increase quantity for ${item.name}`}
                              >
                                +
                              </button>
                            </div>
                          </div>

                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-[#ddd8cc] bg-white p-8 text-center">
                  <p className="text-base font-semibold text-[#244f46]">No menu items available right now.</p>
                </div>
              )}
            </div>

            {showAddressCard && (
              <div className="mt-4 rounded-2xl border border-[#ddd8cc] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] lg:hidden">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#6f6c64]">Delivery Address</p>
                    <p className="mt-1 text-sm font-medium text-[#1f2e2a]">
                      {currentAddressDisplay || (isLoadingAddresses ? 'Loading saved address...' : 'Saved address available')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`${basePath}/order-address`, {
                        state: {
                          editAddressId: currentAddressId || undefined,
                          prefilledCustomerName: location.state?.prefilledCustomerName,
                        },
                      })
                    }
                    className="rounded-lg border border-[#1f6f5f] px-3 py-1.5 text-xs font-semibold text-[#1f6f5f] transition hover:bg-[#eef7f4]"
                  >
                    Edit Address
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-[#ddd8cc] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
              <h3 className="text-base font-bold text-[#1f2e2a]">Add-ons</h3>
              {separateAddonOptions.length ? (
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {separateAddonOptions.map((addon) => (
                    <label key={addon.key} className="flex items-center justify-between gap-2 rounded-lg border border-[#ece3d3] bg-[#fbf7ef] p-2.5 text-xs text-[#37443f]">
                      <span className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedAddonKeys.includes(addon.key)}
                          onChange={() => toggleAddon(addon.key)}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-[#1f6f5f] focus:ring-[#1f6f5f]"
                        />
                        <img
                          src={resolveImageSrc(addon.imageUrl, fallbackThumb)}
                          alt={addon.name}
                          className="h-11 w-11 rounded-md border border-[#ded7c8] object-cover"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.src = fallbackThumb;
                          }}
                        />
                        <span className="line-clamp-1">{addon.name}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">+₹{addon.price || 0}</span>
                        <div className="inline-flex items-center rounded-lg border border-[#d5d0c3] bg-white">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              updateAddonQuantity(addon.key, 'dec');
                            }}
                            className="h-7 w-7 text-sm font-bold text-[#2a5f54]"
                            aria-label={`Decrease quantity for ${addon.name}`}
                          >
                            -
                          </button>
                          <span className="min-w-7 text-center text-xs font-bold text-[#1f2e2a]">
                            {getAddonQuantity(addon.key)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              updateAddonQuantity(addon.key, 'inc');
                            }}
                            className="h-7 w-7 text-sm font-bold text-[#2a5f54]"
                            aria-label={`Increase quantity for ${addon.name}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-[#7d786f]">
                  {isLoadingProducts ? 'Loading add-on products...' : 'No ADD_ON products available.'}
                </p>
              )}
            </div>

            {selectedItem && (
              <div className="mt-4 rounded-2xl border border-[#ddd8cc] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3 text-[#1f2e2a]">
                    <span className="font-semibold">
                      {selectedItem.product?.productName || selectedItem.name}
                      {getQuantity(selectedItem.id) > 1 ? ` x${getQuantity(selectedItem.id)}` : ''}
                    </span>
                    <span className="font-semibold">₹{getMealTotal(selectedItem)}</span>
                  </div>
                  {selectedAddons.map((addon) => (
                    <div key={addon.key} className="flex items-center justify-between gap-3 text-[#4a5550]">
                      <span>
                        {addon.name} x{addon.quantity}
                      </span>
                      <span>₹{Number(addon.price || 0) * Number(addon.quantity || 1)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-3 text-[#4a5550]">
                    <span>Free Delivery</span>
                    <span>₹0</span>
                  </div>
                </div>
                <p className="mt-3 flex items-center justify-between text-lg font-semibold text-[#2f3d39]">
                  <span>Total</span>
                  <span className="font-black" style={{ color: accent }}>
                    ₹{getTotalPrice(selectedItem)}
                  </span>
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default OrderPage;
