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

export default Skeleton;
