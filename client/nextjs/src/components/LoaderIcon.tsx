'use client';

import { useEffect, useState } from 'react';

interface ILoaderIconProps {
    isLoading?: boolean;
}

const LoaderIcon = ({ isLoading }: ILoaderIconProps) => {

    return (
        <>
            {isLoading && (
                <div className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center bg-ink-900 bg-opacity-40 z-50">
                    <i className="fas fa-spinner fa-spin fa-3x text-terracotta-300"></i>
                </div>
            )}
        </>
    );
};

export default LoaderIcon;


