'use client';
import type { IChartInfo } from './chart';
import { useEffect, useState } from 'react';

import Navbar from '@/components/Navbar';
import Image from 'next/image';
import { getShortName, toCurrency } from '@/utils/convert';

import {
    Bar, Doughnut, PolarArea,
    createBarChartData, createBasicChartData
} from './chart';
import { getOrderStats, addProduct } from '@/utils/services';

function getBrandPurchaseChartInfo(_orderStats?: api.OrderStatsResponse) {
    const chartInfo: IChartInfo = {
        xAxisLabel: "Brands",
        yAxisLabel: "Purchase Amount"
    }
    if (_orderStats?.brandPurchaseAmountSet?.length) {
        const labels: string[] = [];
        const values: number[] = [];

        _orderStats.brandPurchaseAmountSet.forEach(itm => {
            labels.push(itm.value);
            values.push(itm.score);
        })

        chartInfo.labels = labels;
        chartInfo.dataSets = [{
            name: "BrandPurchaseAmount",
            values: values
        }];
    }

    //const { chartData, chartOptions } = createBarChartData(chartInfo);
    const { chartData, chartOptions } = createBasicChartData(chartInfo, false);

    return {
        chartData,
        chartOptions
    }
}

function getCategoryPurchaseChartInfo(_orderStats?: api.OrderStatsResponse) {
    const chartInfo: IChartInfo = {
        xAxisLabel: "Category",
        yAxisLabel: "Purchase Amount"
    }
    if (_orderStats?.categoryPurchaseAmountSet?.length) {
        const labels: string[] = [];
        const values: number[] = [];

        _orderStats.categoryPurchaseAmountSet.forEach(itm => {
            labels.push(itm.value);
            values.push(itm.score);
        })

        chartInfo.labels = labels;
        chartInfo.dataSets = [{
            name: "CategoryPurchaseAmount",
            values: values
        }];
    }

    const { chartData, chartOptions } = createBasicChartData(chartInfo, true);
    return {
        chartData,
        chartOptions
    }
}

function getProductPurchaseChartInfo(_orderStats?: api.OrderStatsResponse) {
    const chartInfo: IChartInfo = {
        xAxisLabel: "Product",
        yAxisLabel: "Purchase Qty"
    }
    if (_orderStats?.productPurchaseQtySet?.length) {
        const labels: string[] = [];
        const values: number[] = [];

        _orderStats.productPurchaseQtySet.forEach(itm => {
            labels.push(itm.value);
            values.push(itm.score);
        })

        chartInfo.labels = labels;
        chartInfo.dataSets = [{
            name: "ProductPurchaseQty",
            values: values
        }];
    }

    // const { chartData, chartOptions } = createBasicChartData(chartInfo);
    const { chartData, chartOptions } = createBarChartData(chartInfo);
    return {
        chartData,
        chartOptions
    }
}

function getDummyData() {
    return {
        "totalPurchaseAmount": "18629",
        "productPurchaseQtySet": [
            {
                "value": "11000",
                "score": 1
            },
            {
                "value": "11009",
                "score": 1
            },
            {
                "value": "11010",
                "score": 1
            },
            {
                "value": "11017",
                "score": 1
            },
            {
                "value": "11021",
                "score": 1
            },
            {
                "value": "11001",
                "score": 2
            }
        ],
        "categoryPurchaseAmountSet": [
            {
                "value": "apparel:topwear",
                "score": 3734
            },
            {
                "value": "accessories:watches",
                "score": 14895
            }
        ],
        "brandPurchaseAmountSet": [
            {
                "value": "Inkfruit",
                "score": 499
            },
            {
                "value": "Wrangler",
                "score": 3235
            },
            {
                "value": "Puma",
                "score": 14895
            }
        ],
        "products": [
            {
                "productId": "11000",
                "price": 3995,
                "productDisplayName": "Puma Men Slick 3HD Yellow Black Watches",
                "variantName": "Slick 3HD Yellow",
                "brandName": "Puma",
                "ageGroup": "Adults-Men",
                "gender": "Men",
                "displayCategories": "Accessories",
                "styleImages_default_imageURL": "http://host.docker.internal:8080/images/11000.jpg",
                "productDescriptors_description_value": "",
                "stockQty": 25,
            },
            {
                "productId": "11001",
                "price": 5450,
                "productDisplayName": "Puma Men Top Fluctuation Red Black Watches",
                "variantName": "Top Fluctuation Red",
                "brandName": "Puma",
                "ageGroup": "Adults-Men",
                "gender": "Men",
                "displayCategories": "Accessories",
                "styleImages_default_imageURL": "http://host.docker.internal:8080/images/11001.jpg",
                "productDescriptors_description_value": "",
                "stockQty": 25,
            },
            {
                "productId": "11009",
                "price": 499,
                "productDisplayName": "Inkfruit Men Let Me Skate White Tshirts",
                "variantName": "Let Me Skate",
                "brandName": "Inkfruit",
                "ageGroup": "Adults-Men",
                "gender": "Men",
                "displayCategories": "Casual Wear",
                "styleImages_default_imageURL": "http://host.docker.internal:8080/images/11009.jpg",
                "productDescriptors_description_value": "",
                "stockQty": 25,
            },
            {
                "productId": "11010",
                "price": 1095,
                "productDisplayName": "Wrangler Women Smocked Yoke Purple Tops",
                "variantName": "SMOCKED YOKE",
                "brandName": "Wrangler",
                "ageGroup": "Adults-Women",
                "gender": "Women",
                "displayCategories": "Sale and Clearance,Casual Wear",
                "styleImages_default_imageURL": "http://host.docker.internal:8080/images/11010.jpg",
                "productDescriptors_description_value": "",
                "stockQty": 25,
            },
            {
                "productId": "11017",
                "price": 1295,
                "productDisplayName": "Wrangler Women Floral Print Blue Top",
                "variantName": "POOPY PRINT",
                "brandName": "Wrangler",
                "ageGroup": "Adults-Women",
                "gender": "Women",
                "displayCategories": "Casual Wear",
                "styleImages_default_imageURL": "http://host.docker.internal:8080/images/11017.jpg",
                "productDescriptors_description_value": "",
                "stockQty": 25,
            },
            {
                "productId": "11021",
                "price": 845,
                "productDisplayName": "Wrangler Women Freedom Spirit Black T-Shirts",
                "variantName": "FREEDOM SPIRIT",
                "brandName": "Wrangler",
                "ageGroup": "Adults-Women",
                "gender": "Women",
                "displayCategories": "Sale and Clearance,Casual Wear",
                "styleImages_default_imageURL": "http://host.docker.internal:8080/images/11021.jpg",
                "productDescriptors_description_value": "",
                "stockQty": 25,
            }
        ]
    };
}

import { useRouter } from 'next/navigation';

export default function Home() {
    const [orderStats, setOrderStats] = useState<api.OrderStatsResponse>();
    const router = useRouter();

    // Add Product form state
    const [productForm, setProductForm] = useState({
        productDisplayName: '',
        price: '',
        brandName: '',
        variantName: '',
        ageGroup: '',
        gender: '',
        displayCategories: '',
        masterCategory_typeName: '',
        subCategory_typeName: '',
        styleImages_default_imageURL: '',
        productDescriptors_description_value: '',
        stockQty: '25',
        productColors: '',
    });
    const [addProductMsg, setAddProductMsg] = useState('');
    const [addProductError, setAddProductError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setProductForm({ ...productForm, [e.target.name]: e.target.value });
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddProductMsg('');
        setAddProductError('');
        setIsSubmitting(true);

        try {
            const result = await addProduct({
                ...productForm,
                price: Number(productForm.price),
                stockQty: Number(productForm.stockQty),
            });

            if (result?.data?.productId) {
                setAddProductMsg(`✅ Thêm sản phẩm thành công! ID: ${result.data.productId}`);
                // Reset form
                setProductForm({
                    productDisplayName: '', price: '', brandName: '', variantName: '',
                    ageGroup: '', gender: '', displayCategories: '', masterCategory_typeName: '',
                    subCategory_typeName: '', styleImages_default_imageURL: '',
                    productDescriptors_description_value: '', stockQty: '25', productColors: '',
                });
            } else {
                setAddProductError(result?.error || 'Thêm sản phẩm thất bại');
            }
        } catch (err) {
            setAddProductError('Lỗi kết nối server');
        }
        setIsSubmitting(false);
    };

    const brandPurchaseChart = getBrandPurchaseChartInfo(orderStats);
    const categoryPurchaseChart = getCategoryPurchaseChartInfo(orderStats);
    const productPurchaseChart = getProductPurchaseChartInfo(orderStats);

    async function refreshBtnClick() {
        const result = await getOrderStats();
        const MAX_TRENDING_ITEMS = 6;

        if (result?.products?.length) {
            result.products = result.products.slice(0, MAX_TRENDING_ITEMS);
        }

        setOrderStats(result);
    }

    useEffect(() => {
        const role = localStorage.getItem('userRole');
        if (role !== 'ADMIN') {
            router.push('/login');
            return;
        }

        (async () => {
            try {
                await refreshBtnClick();
            } catch (err) {
                console.error("Access denied or error fetching stats");
            }
        })();
    }, []);

    return (
        <>
            <Navbar path="admin" />
            <main>
                <div className="max-w-screen-xl mx-auto p-6 pt-16">

                    {/* ===== ADD PRODUCT SECTION ===== */}
                    <div className="mb-8 p-6 bg-white rounded-xl shadow-card border border-terracotta-100">
                        <h2 className="text-xl font-display font-bold uppercase mb-4 text-ink-800">🛍️ Add New Product</h2>

                        {addProductMsg && (
                            <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg">{addProductMsg}</div>
                        )}
                        {addProductError && (
                            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">❌ {addProductError}</div>
                        )}

                        <form onSubmit={handleAddProduct}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-ink-700">Product Name *</label>
                                    <input type="text" name="productDisplayName" value={productForm.productDisplayName}
                                        onChange={handleFormChange} required
                                        className="w-full border border-terracotta-100 rounded-lg px-3 py-2 text-sm text-ink-800 focus:outline-none focus:border-terracotta-300" placeholder="e.g. Nike Air Max 90" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-ink-700">Price *</label>
                                    <input type="number" name="price" value={productForm.price}
                                        onChange={handleFormChange} required min="1"
                                        className="w-full border border-terracotta-100 rounded-lg px-3 py-2 text-sm text-ink-800 focus:outline-none focus:border-terracotta-300" placeholder="e.g. 2500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-ink-700">Brand Name</label>
                                    <input type="text" name="brandName" value={productForm.brandName}
                                        onChange={handleFormChange}
                                        className="w-full border border-terracotta-100 rounded-lg px-3 py-2 text-sm text-ink-800 focus:outline-none focus:border-terracotta-300" placeholder="e.g. Nike" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-ink-700">Variant Name</label>
                                    <input type="text" name="variantName" value={productForm.variantName}
                                        onChange={handleFormChange}
                                        className="w-full border border-terracotta-100 rounded-lg px-3 py-2 text-sm text-ink-800 focus:outline-none focus:border-terracotta-300" placeholder="e.g. Black Edition" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-ink-700">Gender</label>
                                    <select name="gender" value={productForm.gender} onChange={handleFormChange}
                                        className="w-full border border-terracotta-100 rounded-lg px-3 py-2 text-sm text-ink-800 focus:outline-none focus:border-terracotta-300">
                                        <option value="">-- Select --</option>
                                        <option value="Men">Men</option>
                                        <option value="Women">Women</option>
                                        <option value="Unisex">Unisex</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-ink-700">Age Group</label>
                                    <select name="ageGroup" value={productForm.ageGroup} onChange={handleFormChange}
                                        className="w-full border border-terracotta-100 rounded-lg px-3 py-2 text-sm text-ink-800 focus:outline-none focus:border-terracotta-300">
                                        <option value="">-- Select --</option>
                                        <option value="Adults-Men">Adults-Men</option>
                                        <option value="Adults-Women">Adults-Women</option>
                                        <option value="Kids-Boys">Kids-Boys</option>
                                        <option value="Kids-Girls">Kids-Girls</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-ink-700">Category</label>
                                    <input type="text" name="displayCategories" value={productForm.displayCategories}
                                        onChange={handleFormChange}
                                        className="w-full border border-terracotta-100 rounded-lg px-3 py-2 text-sm text-ink-800 focus:outline-none focus:border-terracotta-300" placeholder="e.g. Casual Wear" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-ink-700">Master Category</label>
                                    <input type="text" name="masterCategory_typeName" value={productForm.masterCategory_typeName}
                                        onChange={handleFormChange}
                                        className="w-full border border-terracotta-100 rounded-lg px-3 py-2 text-sm text-ink-800 focus:outline-none focus:border-terracotta-300" placeholder="e.g. Apparel" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-ink-700">Sub Category</label>
                                    <input type="text" name="subCategory_typeName" value={productForm.subCategory_typeName}
                                        onChange={handleFormChange}
                                        className="w-full border border-terracotta-100 rounded-lg px-3 py-2 text-sm text-ink-800 focus:outline-none focus:border-terracotta-300" placeholder="e.g. Topwear" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-ink-700">Stock Quantity</label>
                                    <input type="number" name="stockQty" value={productForm.stockQty}
                                        onChange={handleFormChange} min="0"
                                        className="w-full border border-terracotta-100 rounded-lg px-3 py-2 text-sm text-ink-800 focus:outline-none focus:border-terracotta-300" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-ink-700">Image URL</label>
                                    <input type="text" name="styleImages_default_imageURL" value={productForm.styleImages_default_imageURL}
                                        onChange={handleFormChange}
                                        className="w-full border border-terracotta-100 rounded-lg px-3 py-2 text-sm text-ink-800 focus:outline-none focus:border-terracotta-300" placeholder="https://example.com/image.jpg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-ink-700">Colors</label>
                                    <input type="text" name="productColors" value={productForm.productColors}
                                        onChange={handleFormChange}
                                        className="w-full border border-terracotta-100 rounded-lg px-3 py-2 text-sm text-ink-800 focus:outline-none focus:border-terracotta-300" placeholder="e.g. Black, White, Red" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-semibold mb-1 text-ink-700">Description</label>
                                <textarea name="productDescriptors_description_value" value={productForm.productDescriptors_description_value}
                                    onChange={handleFormChange} rows={3}
                                    className="w-full border border-terracotta-100 rounded-lg px-3 py-2 text-sm text-ink-800 focus:outline-none focus:border-terracotta-300" placeholder="Product description..." />
                            </div>
                            <div className="mt-4">
                                <button type="submit" disabled={isSubmitting}
                                    className="inline-block rounded-full bg-terracotta-500 hover:bg-terracotta-600 disabled:bg-gray-400 px-6 py-2.5 text-sm font-semibold uppercase tracking-wide leading-normal text-white shadow-md transition-colors">
                                    {isSubmitting ? 'Adding...' : '➕ Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* ===== DASHBOARD STATS SECTION ===== */}
                    <div className="mb-2 flex justify-between items-center flex-wrap gap-2">
                        <h5 className="font-bold uppercase text-ink-800">
                            Total Purchase Amount :
                            <span className="text-sm pl-1 font-normal text-ink-700">
                                {toCurrency(orderStats?.totalPurchaseAmount)}
                            </span>
                        </h5>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const dummy = getDummyData();
                                    setOrderStats(dummy as any);
                                }}
                                className="inline-block rounded-full border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 px-4 pt-2 pb-2 text-xs font-semibold uppercase tracking-wide leading-normal transition-colors">
                                🧪 Nạp Dữ Liệu Mẫu (Demo)
                            </button>
                            <button
                                type="button"
                                onClick={refreshBtnClick}
                                className="inline-block rounded-full border border-terracotta-300 text-terracotta-700 hover:bg-terracotta-50 px-4 pt-2 pb-2 text-xs font-semibold uppercase tracking-wide leading-normal transition-colors">
                                🔄 Refresh Stats
                            </button>
                        </div>
                    </div>

                    <hr className="border-terracotta-100" />

                    <div className="pt-3 flex justify-between flex-wrap gap-4">
                        <div className="flex-1 min-w-[320px] max-w-[550px]">
                            <div className="font-bold uppercase text-ink-800 mb-2">
                                Brand wise revenue
                            </div>
                            <div style={{ width: "500px", maxWidth: "100%" }}>
                                {brandPurchaseChart.chartData.datasets && brandPurchaseChart.chartData.datasets.length > 0 ? (
                                    //@ts-ignore
                                    <Doughnut data={brandPurchaseChart.chartData} options={brandPurchaseChart.chartOptions} />
                                ) : (
                                    <div className="h-56 flex flex-col items-center justify-center border-2 border-dashed border-terracotta-200 rounded-xl text-ink-500 bg-cream-50 p-4 text-center">
                                        <span className="text-3xl mb-2">📊</span>
                                        <p className="text-sm font-semibold">Chưa có dữ liệu theo thương hiệu</p>
                                        <p className="text-xs text-ink-400 mt-1">Bấm &quot;Nạp Dữ Liệu Mẫu&quot; ở trên để xem thử biểu đồ</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 min-w-[320px] max-w-[550px]">
                            <div className="font-bold uppercase text-ink-800 mb-2">
                                Category wise interests
                            </div>
                            <div style={{ width: "500px", maxWidth: "100%" }}>
                                {categoryPurchaseChart.chartData.datasets && categoryPurchaseChart.chartData.datasets.length > 0 ? (
                                    //@ts-ignore
                                    <PolarArea data={categoryPurchaseChart.chartData} options={categoryPurchaseChart.chartOptions} />
                                ) : (
                                    <div className="h-56 flex flex-col items-center justify-center border-2 border-dashed border-terracotta-200 rounded-xl text-ink-500 bg-cream-50 p-4 text-center">
                                        <span className="text-3xl mb-2">🏷️</span>
                                        <p className="text-sm font-semibold">Chưa có dữ liệu theo danh mục</p>
                                        <p className="text-xs text-ink-400 mt-1">Bấm &quot;Nạp Dữ Liệu Mẫu&quot; ở trên để xem thử biểu đồ</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    <hr className="border-terracotta-100 mt-3" />

                    <div className="pt-3">
                        <div className="font-bold uppercase text-ink-800 mb-2">
                            Top Trending Products
                        </div>
                        {orderStats?.products && orderStats.products.length > 0 ? (
                            <div className="pt-3 flex flex-wrap justify-start">
                                {orderStats.products.map((product) => (
                                    <div key={product.productId} className="block max-w-sm rounded-xl bg-white shadow-card border border-terracotta-100 m-2 overflow-hidden">
                                        <Image
                                            className="w-auto mx-auto"
                                            style={{ height: '160px' }}
                                            src={product.styleImages_default_imageURL}
                                            alt={product.productDisplayName}
                                            width={480}
                                            height={640}
                                        />
                                        <hr className="border-terracotta-100" />
                                        <div className="p-6 bg-cream-100">
                                            <h5 className="mb-2 h-20 text-lg font-display font-semibold leading-tight text-ink-800">
                                                {product.productDisplayName}
                                            </h5>
                                            <p className="mb-4 text-sm text-ink-600">
                                                {getShortName(product.productDescriptors_description_value)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center border-2 border-dashed border-terracotta-200 rounded-xl text-ink-500 bg-cream-50 mt-2">
                                <span className="text-3xl mb-2 block">🛍️</span>
                                <p className="text-sm font-semibold">Chưa có sản phẩm thịnh hành</p>
                                <p className="text-xs text-ink-400 mt-1">Sản phẩm bán chạy sẽ tự động được hiển thị tại đây khi có đơn mua</p>
                            </div>
                        )}
                    </div>
                </div>
            </main >
        </>

    );
}
