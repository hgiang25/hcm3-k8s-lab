'use client';
import type { IChatMessageCallbackData } from '@/components/Chat';

import ProductCard from '@/components/ProductCard';
import Navbar from '@/components/Navbar';
import Cart from '@/components/Cart';
import Alert from '@/components/Alert';
import LoaderIcon from '@/components/LoaderIcon';
import HeroSection from '@/components/HeroSection';
import CategorySection from '@/components/CategorySection';
import BrandSection from '@/components/BrandSection';
import FooterSection from '@/components/FooterSection';
import {
    getProducts, getProductsPaged, getProductsByVSSText, getProductsByVSSImageSummary,
    triggerResetInventory,
    chatBot, getChatHistory
} from '@/utils/services';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { default as Chat, CHAT_CONSTANTS } from '@/components/Chat';
import {
    setObjectToWindowQueryParams,
    getObjectFromWindowQueryParams,
    convertObjectToLabel,
    formatChatBotAnswer
} from '@/utils/convert';
import { getClientConfig, SEARCH_TYPES } from '@/config/client-config';

const PAGE_SIZE = 24; // products per page on the storefront home page

export default function Home() {
    const CLIENT_CONFIG = getClientConfig();

    const [products, setProducts] = useState<models.Product[]>();
    const [alertNotification, setAlertNotification] = useState({ title: '', message: '' });
    const [filterLabel, setFilterLabel] = useState<string>();
    const [oldChatHistory, setOldChatHistory] = useState<IChatMessage[]>([]);
    const [searchPlaceHolder, setSearchPlaceHolder] = useState<string>();
    const [showLoader, setShowLoader] = useState<boolean>(false);

    // pagination state - only meaningful for the normal (non semantic) product listing
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [isPagedListing, setIsPagedListing] = useState<boolean>(true);

    // ref for scrolling to the product listing section
    const productSectionRef = useRef<HTMLDivElement>(null);

    function scrollToProducts() {
        productSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async function refreshProducts(searchData?: models.Product, targetPage: number = 1) {
        if (!searchData) {
            searchData = getObjectFromWindowQueryParams();
        }

        let productsData: models.Product[] = [];
        let newTotalCount = 0;
        let pagedListing = true;

        setShowLoader(true);

        try {
            if (CLIENT_CONFIG.SEARCH_TYPE.VALUE == SEARCH_TYPES.VSS_TEXT.VALUE
                && searchData?.productDisplayName && !searchData?.productId) {
                const searchText = searchData?.productDisplayName;
                const embeddings = CLIENT_CONFIG.SEARCH_TYPE.OTHER.VSS_EMBEDDINGS;
                productsData = await getProductsByVSSText(searchText, embeddings);
                pagedListing = false;
            }
            else if (CLIENT_CONFIG.SEARCH_TYPE.VALUE == SEARCH_TYPES.VSS_IMAGE_SUMMARY.VALUE
                && searchData?.productDisplayName && !searchData?.productId) {
                const searchText = searchData?.productDisplayName;
                productsData = await getProductsByVSSImageSummary(searchText);
                pagedListing = false;
            }
            else {
                const paged = await getProductsPaged(searchData?.productDisplayName, searchData?.productId, targetPage, PAGE_SIZE);
                productsData = paged.data;
                newTotalCount = paged.totalCount;
                pagedListing = true;
            }

            setProducts([...productsData]);
            setIsPagedListing(pagedListing);
            setTotalCount(newTotalCount);
            setCurrentPage(targetPage);

            setObjectToWindowQueryParams(searchData);

            let searchFilter = convertObjectToLabel(searchData) || "";
            if (searchFilter) {
                searchFilter = " with search : (" + searchFilter + ")";
            }
            setFilterLabel(searchFilter);
        } catch (error) {
            console.error("Failed to load products:", error);
            setProducts([]);
        } finally {
            setShowLoader(false);
        }

    }

    function goToPage(page: number) {
        if (page < 1 || page > totalPages || page === currentPage) {
            return;
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        refreshProducts(getObjectFromWindowQueryParams(), page);
    }

    async function resetStockQtyBtnClick() {
        setAlertNotification({ title: '', message: '' });

        await triggerResetInventory();
        await refreshProducts();

        setAlertNotification({
            title: `RESET STOCK QTY`,
            message:
                'Stock Qty of all products are updated to default value!',
        });
    }

    async function chatMessageCallback({ newChatMessage, chatHistory, setChatHistory }: IChatMessageCallbackData) {

        if (newChatMessage.message) {
            const question = newChatMessage.message;
            let answer = await chatBot(question);

            if (answer) {
                answer = formatChatBotAnswer(answer);
            }
            else {
                answer = 'Sorry, Server could not process your request. Please try again later.';
            }

            const responseChatMessage: IChatMessage = {
                sender: CHAT_CONSTANTS.SENDER_ASSISTANT,
                message: answer,
            };
            setChatHistory([...chatHistory, responseChatMessage]);
        }
    }

    useEffect(() => {
        (async () => {
            await refreshProducts();

            const historyArr = await getChatHistory();
            if (historyArr?.length) {
                for (let item of historyArr) {
                    item.message = formatChatBotAnswer(item.message);
                }
                setOldChatHistory(historyArr);
            }

            if (CLIENT_CONFIG.SEARCH_TYPE.VALUE == SEARCH_TYPES.VSS_TEXT.VALUE) {
                const embeddings = CLIENT_CONFIG.SEARCH_TYPE.OTHER.VSS_EMBEDDINGS;
                setSearchPlaceHolder(`Semantic Search (${embeddings})`);
            }
            else if (CLIENT_CONFIG.SEARCH_TYPE.VALUE == SEARCH_TYPES.VSS_IMAGE_SUMMARY.VALUE) {
                setSearchPlaceHolder(`Semantic Search on Image`);
            }

        })();
    }, []);

    const totalPages = isPagedListing ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) : 1;

    return (
        <>
            <LoaderIcon isLoading={showLoader} />
            <Navbar refreshProducts={(searchData) => refreshProducts(searchData, 1)} searchPlaceHolder={searchPlaceHolder} />
            <Cart refreshProducts={refreshProducts} setAlertNotification={setAlertNotification} />

            {CLIENT_CONFIG.AI_CHAT_BOT.VALUE &&
                <Chat chatMessageCallback={chatMessageCallback} oldChatHistory={oldChatHistory} />
            }

            {/* ── HERO ── */}
            <div className="pt-14">
                <HeroSection onShopNow={scrollToProducts} />
            </div>

            {/* ── CATEGORIES ── */}
            <CategorySection onCategoryClick={() => scrollToProducts()} />

            {/* ── BRAND / ABOUT / TESTIMONIALS / NEWSLETTER ── */}
            <BrandSection />

            {/* ── PRODUCT LISTING ── */}
            <div ref={productSectionRef} id="product-listing" className="scroll-mt-16" />
            <main className="bg-cream-50 py-4">
                {/* Section header */}
                <div className="max-w-screen-xl mx-auto px-6 pt-10 pb-6 text-center">
                    <span className="text-terracotta-500 text-sm font-semibold uppercase tracking-widest">Our Collection</span>
                    <h2 className="font-display text-ink-800 text-4xl md:text-5xl font-bold mt-2 mb-3">
                        Shop All Products
                    </h2>
                    <p className="text-ink-600 max-w-lg mx-auto text-sm leading-relaxed">
                        Discover our full range of premium fashion — use the search bar above to filter by name or style.
                    </p>
                    <div className="mt-4 h-0.5 w-16 bg-terracotta-400 mx-auto rounded-full" />
                </div>

                <div className="max-w-screen-xl mx-auto mt-6 px-6 pb-10">
                    <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                        <span className="text-sm text-ink-600">
                            {isPagedListing
                                ? <>Showing <span className="font-semibold text-ink-800">{products?.length}</span> of <span className="font-semibold text-ink-800">{totalCount}</span> products{filterLabel}</>
                                : <>Showing <span className="font-semibold text-ink-800">{products?.length}</span> products{filterLabel}</>
                            }
                        </span>

                        {CLIENT_CONFIG.TRIGGERS_FUNCTIONS.VALUE &&

                            <button
                                type="button"
                                onClick={resetStockQtyBtnClick}
                                className="inline-block rounded-full border border-terracotta-300 text-terracotta-700 hover:bg-terracotta-50 px-4 pt-2 pb-2 text-xs font-semibold uppercase tracking-wide leading-normal transition-colors">
                                Reset Stock QTY
                            </button>
                        }

                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                        {products?.map((product) => (
                            <ProductCard key={product.productId} product={product} />
                        ))}
                    </div>

                    {isPagedListing && totalPages > 1 &&
                        <nav className="mt-10 flex justify-center items-center gap-1 flex-wrap" aria-label="Product pagination">
                            <button
                                type="button"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage <= 1}
                                className="px-3 py-2 rounded-full text-sm font-medium text-ink-700 hover:bg-terracotta-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                                <i className="fas fa-chevron-left"></i>
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                                        acc.push('ellipsis');
                                    }
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((p, idx) =>
                                    p === 'ellipsis' ? (
                                        <span key={`ellipsis-${idx}`} className="px-2 text-ink-600">…</span>
                                    ) : (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => goToPage(p)}
                                            aria-current={p === currentPage ? 'page' : undefined}
                                            className={`min-w-[2.25rem] h-9 px-2 rounded-full text-sm font-semibold transition-colors ${p === currentPage
                                                ? 'bg-terracotta-500 text-white'
                                                : 'text-ink-700 hover:bg-terracotta-50'
                                                }`}>
                                            {p}
                                        </button>
                                    )
                                )}

                            <button
                                type="button"
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                                className="px-3 py-2 rounded-full text-sm font-medium text-ink-700 hover:bg-terracotta-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        </nav>
                    }
                </div>
            </main>
            {!!alertNotification &&
                typeof window !== 'undefined' &&
                createPortal(<Alert {...alertNotification} />, document.body)}

            {/* ── FOOTER ── */}
            <FooterSection />
        </>
    );
}
