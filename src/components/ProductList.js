import React, { useState , useEffect} from "react";
import { shopifyFetch} from "../utils/shopify";
import { PRODUCTS_QUERY } from "../graphql/queries";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";

//lấy dữ liệu sản phẩm từ shopify api
const ProductList = () => {
    //khởi tạo state để lưu trữ dữ liệu sản phẩm
    const [products, setProducts] = useState([]);//lưu danh sách sản phẩm
    const { addToCart, cartItems } = useCart();//lấy hàm addToCart và cartItems từ CartContext
    const [loading, setLoading] = useState(false);//quản lý trạng thái loading
    const [searchTerm, setSearchTerm] = useState('');//lưu trữ giá trị filter search
    const [priceFilter, setPriceFilter] = useState('all');//lưu trữ giá trị filter price
    const [hasMore, setHasMore] = useState(true);//quản lý trạng thái có thêm sản phẩm không
    const [endCursor, setEndCursor] = useState(null);//lưu trữ cursor cuối cùng
    const PRODUCTS_PER_PAGE = 4;//số lượng sản phẩm trên mỗi trang


    //sử dụng useEffect để gọi hàm fetchProducts khi component được render
    // useEffect chỉ chạy 1 lần khi component được render(mount)
    useEffect(() => {
        fetchProducts();
    }, []); // [] nghĩa là chỉ chạy 1 lần

    const fetchProducts = async (search = '', loadMore = false) => {
        setLoading(true);
        try {
           // Gọi API Shopify thông qua shopifyFetch utility
            const { data} = await shopifyFetch({
                query: PRODUCTS_QUERY,// GraphQL query để lấy sản phẩm
                variables: { 
                    query: search, // Truyền search term vào query
                    first: PRODUCTS_PER_PAGE,//các sản phẩm cần lấy
                    after: loadMore ? endCursor : null// nếu loadMore = true thì lấy từ vị trí endCursor
                }
            });
            console.log('Data:', data);
            // format dữ liệu sản phẩm từ response API
            const formattedProducts = data.products.edges.map(({ node }) => ({
                id: node.id,
                title: node.title,
                description: node.description,
                image: node.images.edges[0]?.node.url,
                variants: {
                    edges: node.variants.edges.map(({ node: variant }) => ({
                        node: {
                            id: variant.id,
                            priceV2: variant.priceV2
                        }
                    }))
                }
            }));
            // Cập nhật state với dữ liệu đã format
            // setProducts(formattedProducts);

            // Cập nhật state products
            setProducts(prev => 
                loadMore 
                    ? [...prev, ...formattedProducts] // Nếu loadMore = true thì thêm vào list cũ
                : formattedProducts               // Nếu không thì thay thế hoàn toàn
        );

        // Lưu thông tin phân trang
            setHasMore(data.products.pageInfo.hasNextPage); // còn trang tiếp không
            setEndCursor(data.products.pageInfo.endCursor); // vị trí cuối cùng
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    }
    //xử lý sự kiện khi người dùng nhập vào input search
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        // fetchProducts(e.target.value);
    }
    // Sử dụng useEffect với debounce để tránh gọi API quá nhiều
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchProducts(searchTerm);
        }, 500); // Đợi 500ms sau khi người dùng ngừng gõ
    
            return () => clearTimeout(timeoutId);
        }, [searchTerm]);

    //hàm xử lý khi thay đổi giá
    const handlePriceFilter = (e) => {
        setPriceFilter(e.target.value);
    }
    //hàm lọc sản phẩm theo giá
    const getFilteredProducts = () => {
        //nếu không có giá filter thì trả về tất cả sản phẩm
        if (!priceFilter) return products;
        //nếu có filter, lọc sản phẩm theo giá
        return products.filter(product => {
            const price = parseFloat(product.variants.edges[0].node.priceV2.amount);

            switch (priceFilter) {
                case '1000-4000':
                    return price >= 1000 && price <= 4000;
                case '5000-8000':
                    return price >= 5000 && price <= 8000;
                default:
                    return true;
            }   
        })
    }

    function handleAddToCart(product) {
        console.log('Handling add to cart:', product);
        try {
            const productToAdd = {
                id: product.id,
                title: product.title,
                variants: {
                    edges: product.variants.edges
                },
                images: {
                    edges: [{
                        node: {
                            url: product.image
                        }
                    }]
                }
            };
            console.log('Formatted product to add:', productToAdd);
            addToCart(productToAdd);
        } catch (error) {
            console.error('Error in handleAddToCart:', error);
        }
    }

    //hàm load more
    const loadMore = () => {
        if (!loading && hasMore) {
        fetchProducts(searchTerm, true);
       }
    }

    // render component
    return (
        <div className="product-list-container">
            <a className="product-list-title" href="/" ><h1>List Products</h1></a>
            {/* tìm kiếm sản phẩm */}
            <div className="search-container">
                <input
                    className="search-input"
                    type="text"
                    placeholder="Search products"
                    value={searchTerm}
                    onChange={handleSearch}
                />
            </div>
            {/* lọc giá */}
            <div className="filter-container">
                <select
                    className="price-filter"
                    onChange={handlePriceFilter}
                    value={priceFilter}
                >
                    <option value="">Tất cả giá</option>
                    <option value="1000-4000">1000-4000</option>
                    <option value="5000-8000">5000-8000</option>
                </select>
            </div>
            {/* hiển thị loading */}
            {loading ? (
                <div className="loading-spinner">Đang tìm kiếm...</div>
            ) : (
                <>
                    <div className="go-to-cart">
                        <Link to="/cart">
                            <button>Go to Cart ({cartItems.length}) </button>
                        </Link>
                    </div>

                    {products.length === 0 ? (
                        <div className="no-products">
                            <div className="no-products-content">
                                <img 
                                    src="/images/no-results.png" 
                                    alt="No products found"
                                    className="no-products-image"
                                />
                                <p>Không tìm thấy sản phẩm "{searchTerm}"</p>
                                <p className="no-products-suggestions">Gợi ý:</p>
                                <ul>
                                    <li>Thử tìm kiếm với từ khóa khác</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                    <>
                        <div className="products-grid">
                            {/* {products.map((product) => ( */}
                            {getFilteredProducts().map((product) => (
                                <div className="product-item" key={product.id}>
                                    {product.image && <img src={product.image} alt={product.title} />}
                                    <h2>{product.title}</h2>
                                    <p>{product.description}</p>
                                    <p>Price: {product.variants.edges[0].node.priceV2.amount} {product.variants.edges[0].node.priceV2.currencyCode}</p>
                                    <button 
                                        className="add-to-cart-button" 
                                        onClick={() => handleAddToCart(product)}
                                    >
                                        Add to Cart
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Phần pagination */}
                        <div className="pagination">
                            {hasMore && (
                            <button
                            onClick={loadMore}
                            disabled={loading}
                            >Load more
                            </button>
                            )}

                        </div>
                    </>
                    )}
                </>
            )}
        </div>
    );

}

export default ProductList;


//async là một từ khóa trong JavaScript để khai báo một hàm bất đồng bộ (asynchronous function).
//Khi một hàm được khai báo với async, nó có thể chạy đồng thời với các hàm khác mà không cần phải đợi chúng hoàn thành.
//Điều này rất hữu ích khi cần thực hiện các tác vụ mạng, đọc/ghi file, hoặc thực hiện các hoạt động khác mà có thể dừng việc thực thi hàm đó.
//Khi một hàm được khai báo với async, nó sẽ trả về một Promise.
//Promise là một đối tượng trong JavaScript đại diện cho một giá trị có thể sẽ được trả về sau hoặc không trả về sau.
//Khi một hàm async hoàn thành, nó sẽ trả về một giá trị hoặc ném một lỗi.
//Điều này cho phép sử dụng các hàm async trong các biểu thức await, giúp việc xử lý các hoạt động không đồng bộ trở nên dễ dàng hơn.
