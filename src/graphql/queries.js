export const PRODUCTS_QUERY = `
  query Products($query: String, $first: Int!, $after: String) {
    products(query: $query, first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          description
          images(first: 1) {
            edges {
              node {
                url
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                id
                priceV2 {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  }
`;

// File này định nghĩa cấu trúc dữ liệu mà bạn muốn lấy từ Shopify API sử dụng GraphQL. Nó cho phép:
// Tìm kiếm sản phẩm với từ khóa
// Lấy thông tin cơ bản của sản phẩm (id, tên, mô tả)
// Lấy hình ảnh đầu tiên của sản phẩm
// Lấy thông tin giá từ variant đầu tiên

//cấu trúc dữ liệu trả về
// {
//   data: {
//       products: {
//           pageInfo: {
//               hasNextPage: true,
//               endCursor: "MTAw"
//           },
//           edges: [
//               {
//                   node: {
//                       id: "gid://shopify/Product/123",
//                       title: "iPhone 12",
//                       description: "...",
//                       images: {
//                           edges: [{
//                               node: {
//                                   url: "https://..."
//                               }
//                           }]
//                       },
//                       variants: {
//                           edges: [{
//                               node: {
//                                   id: "gid://shopify/ProductVariant/456",
//                                   priceV2: {
//                                       amount: "1000.0",
//                                       currencyCode: "VND"
//                                   }
//                               }
//                           }]
//                       }
//                   }
//               },
//               // ... các sản phẩm khác
//           ]
//       }
//   }
// }