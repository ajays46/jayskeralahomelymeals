import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useCompanyBasePath, useTenant } from '../context/TenantContext';
import { getThemeForCompany } from '../config/tenantThemes';
import { useMenusForBooking } from '../hooks/adminHook/adminHook';
import { useAddress } from '../hooks/userHooks/userAddress';

const fallbackImages = ['/hero/heroo.png', '/JLG.png', '/hero/heroo.png', '/JLG.png'];

const OrderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tenant = useTenant();
  const basePath = useCompanyBasePath();
  const companyId = tenant?.companyId ?? null;
  const theme = tenant?.theme ?? getThemeForCompany(tenant?.companyPath, tenant?.companyName);
  const accent = theme?.accentColor || theme?.primaryColor || '#FE8C00';
  const { data: menusData, isLoading } = useMenusForBooking(companyId);
  const { addresses: userAddresses, isLoadingAddresses } = useAddress();

  const menuItems = useMemo(() => (Array.isArray(menusData?.data) ? menusData.data : []), [menusData]);
  const topItems = menuItems.slice(0, 6);
  const hasStateAddress = Boolean(location.state?.prefilledAddressId);
  const hasSavedAddress = Array.isArray(userAddresses) && userAddresses.length > 0;

  useEffect(() => {
    if (isLoadingAddresses) return;
    if (!hasStateAddress && !hasSavedAddress) {
      navigate(`${basePath}/order-address`, { replace: true });
    }
  }, [isLoadingAddresses, hasStateAddress, hasSavedAddress, navigate, basePath]);

  const handleOrder = () => {
    if (!hasStateAddress && !hasSavedAddress) {
      navigate(`${basePath}/order-address`);
      return;
    }
    navigate(`${basePath}/place-order`, {
      state: {
        initialTab: 'menu',
        skipToMenuSelection: true,
        prefilledAddressId: location.state?.prefilledAddressId,
        prefilledAddressDisplay: location.state?.prefilledAddressDisplay,
        prefilledCustomerName: location.state?.prefilledCustomerName,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#f6f1e7]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Navbar minimalNav />
      <main className="pt-16 sm:pt-[72px] pb-8">
        <section className="px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mt-2">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="h-64 animate-pulse rounded-2xl border border-[#e5dfd2] bg-white" />
                  ))}
                </div>
              ) : topItems.length ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {topItems.map((item, index) => (
                    <article
                      key={item.id}
                      className="overflow-hidden rounded-2xl border border-[#ddd8cc] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
                    >
                      <div className="relative h-40 w-full bg-[#e8dfd0]">
                        <img
                          src={fallbackImages[index % fallbackImages.length]}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>

                      <div className="p-4">
                        <h3 className="line-clamp-1 text-lg font-bold text-[#1f2e2a]">{item.name}</h3>
                        <p className="mt-1 line-clamp-1 text-xs text-[#7d786f]">{item.menuName || 'Chef Special'}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-xl font-black" style={{ color: accent }}>
                            ₹{item.price}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleOrder}
                          className="mt-4 w-full rounded-xl bg-[#1f6f5f] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-105"
                        >
                          Order This
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-[#ddd8cc] bg-white p-8 text-center">
                  <p className="text-base font-semibold text-[#244f46]">No items available right now.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default OrderPage;
