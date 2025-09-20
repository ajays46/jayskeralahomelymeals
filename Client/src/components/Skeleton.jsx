import React from 'react';

const Skeleton = ({ 
  className = '', 
  width = '100%', 
  height = '20px', 
  rounded = 'md',
  animate = true 
}) => {
  return (
    <div
      className={`bg-gray-200 ${animate ? 'animate-pulse' : ''} ${className}`}
      style={{
        width,
        height,
        borderRadius: rounded === 'full' ? '50%' : 
                     rounded === 'lg' ? '8px' : 
                     rounded === 'md' ? '6px' : 
                     rounded === 'sm' ? '4px' : '0px'
      }}
    />
  );
};

// Skeleton components for specific use cases
export const SkeletonText = ({ lines = 1, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height="16px"
          width={index === lines - 1 ? '75%' : '100%'}
          rounded="sm"
        />
      ))}
    </div>
  );
};

export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center space-x-3 mb-3">
        <Skeleton width="40px" height="40px" rounded="full" />
        <div className="flex-1">
          <Skeleton height="16px" width="60%" className="mb-2" />
          <Skeleton height="14px" width="40%" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
};

export const SkeletonTable = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Table Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton
              key={index}
              height="16px"
              width={index === 0 ? '20%' : index === columns - 1 ? '15%' : '25%'}
              rounded="sm"
            />
          ))}
        </div>
      </div>
      
      {/* Table Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-4 py-4">
            <div className="flex items-center space-x-4">
              <Skeleton width="40px" height="40px" rounded="full" />
              <div className="flex-1 grid grid-cols-3 gap-4">
                {Array.from({ length: columns - 1 }).map((_, colIndex) => (
                  <div key={colIndex} className="space-y-2">
                    <Skeleton height="14px" width="80%" rounded="sm" />
                    <Skeleton height="12px" width="60%" rounded="sm" />
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <Skeleton width="60px" height="32px" rounded="md" />
                <Skeleton width="60px" height="32px" rounded="md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonFilters = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Skeleton height="40px" width="100%" rounded="md" />
          </div>
          <div className="flex gap-2">
            <Skeleton width="100px" height="40px" rounded="md" />
            <Skeleton width="120px" height="40px" rounded="md" />
          </div>
        </div>
        
        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton
              key={index}
              width={`${80 + Math.random() * 40}px`}
              height="32px"
              rounded="full"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const SkeletonHeader = ({ className = '' }) => {
  return (
    <div className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton width="32px" height="32px" rounded="lg" />
            <div>
              <Skeleton height="20px" width="200px" className="mb-1" />
              <Skeleton height="14px" width="150px" />
            </div>
          </div>
          <div className="flex space-x-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                width="100px"
                height="36px"
                rounded="lg"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonPagination = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-between px-4 py-3 border-t border-gray-200 ${className}`}>
      <div className="flex items-center space-x-2">
        <Skeleton height="16px" width="120px" rounded="sm" />
      </div>
      <div className="flex items-center space-x-2">
        <Skeleton width="32px" height="32px" rounded="md" />
        <Skeleton width="32px" height="32px" rounded="md" />
        <Skeleton width="32px" height="32px" rounded="md" />
        <Skeleton width="32px" height="32px" rounded="md" />
        <Skeleton width="32px" height="32px" rounded="md" />
      </div>
    </div>
  );
};

// Dashboard specific skeletons
export const SkeletonStatsCard = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton width="40px" height="40px" rounded="lg" />
        <Skeleton width="60px" height="20px" rounded="sm" />
      </div>
      <div className="space-y-2">
        <Skeleton height="24px" width="80px" rounded="sm" />
        <Skeleton height="16px" width="120px" rounded="sm" />
      </div>
    </div>
  );
};

export const SkeletonDashboard = ({ className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonStatsCard key={index} />
        ))}
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonTable rows={6} columns={4} />
        </div>
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
};

// Order specific skeletons
export const SkeletonOrderCard = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Skeleton width="40px" height="40px" rounded="full" />
          <div>
            <Skeleton height="16px" width="120px" className="mb-1" />
            <Skeleton height="14px" width="80px" />
          </div>
        </div>
        <Skeleton width="80px" height="24px" rounded="full" />
      </div>
      <div className="space-y-2 mb-3">
        <Skeleton height="14px" width="100%" />
        <Skeleton height="14px" width="90%" />
        <Skeleton height="14px" width="70%" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton height="16px" width="100px" />
        <div className="flex space-x-2">
          <Skeleton width="60px" height="32px" rounded="md" />
          <Skeleton width="60px" height="32px" rounded="md" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonOrderList = ({ count = 5, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonOrderCard key={index} />
      ))}
    </div>
  );
};

// Delivery Manager specific skeletons
export const SkeletonDeliveryManager = ({ className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <SkeletonHeader />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonStatsCard key={index} />
        ))}
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="flex space-x-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} width="100px" height="20px" rounded="sm" />
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <SkeletonTable rows={8} columns={5} />
        </div>
      </div>
    </div>
  );
};

// Customer specific skeletons
export const SkeletonCustomerCard = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center space-x-3 mb-3">
        <Skeleton width="48px" height="48px" rounded="full" />
        <div className="flex-1">
          <Skeleton height="18px" width="150px" className="mb-2" />
          <div className="space-y-1">
            <Skeleton height="14px" width="120px" />
            <Skeleton height="14px" width="100px" />
          </div>
        </div>
        <div className="text-right">
          <Skeleton height="16px" width="80px" className="mb-1" />
          <Skeleton height="14px" width="60px" />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <Skeleton height="12px" width="60px" />
          <Skeleton height="12px" width="80px" />
        </div>
        <div className="flex space-x-2">
          <Skeleton width="60px" height="32px" rounded="md" />
          <Skeleton width="60px" height="32px" rounded="md" />
        </div>
      </div>
    </div>
  );
};

// Booking Wizard specific skeletons
export const SkeletonWizardStep = ({ className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Step Header */}
      <div className="text-center">
        <Skeleton height="24px" width="200px" className="mx-auto mb-2" />
        <Skeleton height="16px" width="300px" className="mx-auto" />
      </div>
      
      {/* Step Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Skeleton height="40px" width="100%" rounded="md" />
          <Skeleton height="40px" width="100%" rounded="md" />
          <Skeleton height="40px" width="100%" rounded="md" />
        </div>
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
};

// Chart skeletons
export const SkeletonChart = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton height="20px" width="150px" />
        <Skeleton width="100px" height="32px" rounded="md" />
      </div>
      <div className="h-64 flex items-end justify-between space-x-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton
            key={index}
            width="40px"
            height={`${Math.random() * 200 + 50}px`}
            rounded="sm"
          />
        ))}
      </div>
    </div>
  );
};

// Loading states for specific components
export const SkeletonLoading = ({ message = "Loading...", className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
      <Skeleton height="16px" width="120px" rounded="sm" />
    </div>
  );
};

export default Skeleton;
