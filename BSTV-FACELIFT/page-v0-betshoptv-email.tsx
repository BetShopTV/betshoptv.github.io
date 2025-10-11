"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface ProductReal {
  id: string // "3-1a", "4-10a"
  grupo: string // "3", "4", "5"
  peca: string // "1", "2", "10"
  titulo: string // "03/01 Rádio 01"
  apelido: string // "FLENGAAAAAAAA", "Roberta Close"
  preco: number // 200, 150, 1800
  precoVenda: number // 0, "", 800 (se preenchido = VENDIDO)
  disponivel: boolean // baseado em precoVenda
  imagens: string[] // ["03-01a.avif", "03-01b.avif"]
  tecnica: string // "EVA Tijolinho", "EVA Colorido"
  dimensoes: string // "57 x 18 x 10 cm"
  emExposicao: string // informações de exposição
  cores: string // campo para futuro uso
  tags: string // campo para futuro uso
  ondeRepete: string // campo para futuro uso
  extra: string // datas ou informações extras
  promocao: string // campo para futuro uso
  isFavorited: boolean // controle local
  isInCart: boolean // controle local
}

const CACHE_KEY = "betshop_products"
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos
const GOOGLE_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbydfqi0G8PnmvshPSbGjWZnWBjOKA965l4TbVqvS3YQYO9bcYulknvMjUn3V2AEFxSV/exec"

const getCachedProducts = (): ProductReal[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log("[v0] Using cached products data")
        return data
      }
    }
  } catch (error) {
    console.error("[v0] Error reading cache:", error)
  }
  return null
}

const setCachedProducts = (products: ProductReal[]) => {
  try {
    const cacheData = {
      data: products,
      timestamp: Date.now(),
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
    console.log("[v0] Products cached successfully")
  } catch (error) {
    console.error("[v0] Error setting cache:", error)
  }
}

const ProductSkeleton = () => (
  <div className="mb-0">
    <div className="relative border border-black animate-pulse" style={{ backgroundColor: "#f0f0f0" }}>
      <div className="w-full h-48 bg-gray-300"></div>
    </div>
    <div className="w-full h-8 bg-gray-300 animate-pulse mt-[-1px] mb-3"></div>
  </div>
)

const EMERGENCY_PRODUCTS: ProductReal[] = [
  {
    id: "3-1a",
    grupo: "3",
    peca: "1",
    titulo: "03/01 Produto Emergência",
    apelido: "Produto de Backup",
    preco: 150,
    precoVenda: 0,
    disponivel: true,
    imagens: ["03-01a.avif"],
    tecnica: "Material Padrão",
    dimensoes: "50 x 20 x 5 cm",
    emExposicao: "",
    cores: "",
    tags: "",
    ondeRepete: "",
    extra: "",
    promocao: "",
    isFavorited: false,
    isInCart: false,
  },
]

export default function BarraShopping() {
  const [products, setProducts] = useState<ProductReal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<ProductReal[]>([])
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(["TODAS"]))
  const [availableGroups, setAvailableGroups] = useState<string[]>([])
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc") // desc = + RECENTES, asc = - RECENTES

  const fetchProductsFromGoogleSheets = async (): Promise<ProductReal[]> => {
    console.log("[v0] Fetching products from Google Sheets...")

    try {
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Raw data received:", data)

      if (!data.produtos || !Array.isArray(data.produtos)) {
        throw new Error("Invalid data structure received")
      }

      const transformedProducts: ProductReal[] = data.produtos.map((item: any) => ({
        id: item.id || `${item.grupo}-${item.peca}a`,
        grupo: item.grupo?.toString() || "3",
        peca: item.peca?.toString() || "1",
        titulo: item.titulo || "Produto sem título",
        apelido: item.apelido || "",
        preco: Number(item.preco) || 0,
        precoVenda: Number(item.precoVenda) || 0,
        disponivel: !item.precoVenda || item.precoVenda === 0 || item.precoVenda === "", // Available if no sale price
        imagens: item.imagens || [`${item.grupo}-${item.peca}a.avif`],
        tecnica: item.tecnica || "",
        dimensoes: item.dimensoes || "",
        emExposicao: item.emExposicao || "",
        cores: item.cores || "",
        tags: item.tags || "",
        ondeRepete: item.ondeRepete || "",
        extra: item.extra || "",
        promocao: item.promocao || "",
        isFavorited: false,
        isInCart: false,
      }))

      console.log("[v0] Transformed products:", transformedProducts.length)
      return transformedProducts
    } catch (error) {
      console.error("[v0] Error fetching from Google Sheets:", error)
      throw error
    }
  }

  useEffect(() => {
    const loadProducts = async () => {
      console.log("[v0] Starting product load process...")
      setLoading(true)
      setError(null)

      // Try cache first
      const cachedProducts = getCachedProducts()
      if (cachedProducts) {
        setProducts(cachedProducts)
        setLoading(false)

        // Extract unique groups for filters
        const groups = [...new Set(cachedProducts.map((p) => p.grupo))].sort()
        setAvailableGroups(groups)

        return
      }

      // Fetch from Google Sheets
      try {
        const fetchedProducts = await fetchProductsFromGoogleSheets()

        // Cache the results
        setCachedProducts(fetchedProducts)

        setProducts(fetchedProducts)

        // Extract unique groups for filters
        const groups = [...new Set(fetchedProducts.map((p) => p.grupo))].sort()
        setAvailableGroups(groups)

        console.log("[v0] Products loaded successfully:", fetchedProducts.length)
      } catch (error) {
        console.error("[v0] Failed to load products, using emergency fallback:", error)
        setError("Erro ao carregar produtos. Usando dados de emergência.")
        setProducts(EMERGENCY_PRODUCTS)
        setAvailableGroups(["3"])
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  useEffect(() => {
    if (selectedItems.length > 0) {
      setProducts((prev) =>
        prev.map((product) => ({
          ...product,
          isInCart: selectedItems.some((item) => item.id === product.id),
        })),
      )
    }
  }, [selectedItems])

  const toggleFavorite = (id: string) => {
    setProducts((prev) =>
      prev.map((product) => (product.id === id ? { ...product, isFavorited: !product.isFavorited } : product)),
    )
  }

  const toggleCart = (id: string) => {
    const product = products.find((p) => p.id === id)
    if (!product || !product.disponivel) return

    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isInCart: !p.isInCart } : p)))

    if (product.isInCart) {
      setSelectedItems((prev) => prev.filter((item) => item.id !== id))
    } else {
      setSelectedItems((prev) => [...prev, product])
    }
  }

  const removeFromSelected = (id: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== id))
    setProducts((prev) => prev.map((product) => (product.id === id ? { ...product, isInCart: false } : product)))
  }

  const handleSectionClick = (section: string) => {
    if (activeSection === section) {
      setActiveSection(null)
    } else {
      setActiveSection(section)
    }
  }

  const handleFilterClick = (filter: string) => {
    setActiveFilters((prev) => {
      const newFilters = new Set(prev)

      if (filter === "TODAS") {
        return new Set(["TODAS"])
      }

      newFilters.delete("TODAS")

      if (newFilters.has(filter)) {
        newFilters.delete(filter)
      } else {
        newFilters.add(filter)
      }

      if (newFilters.size === 0) {
        return new Set(["TODAS"])
      }

      return newFilters
    })
  }

  const getFilteredProducts = () => {
    let filtered = [...products]

    if (!activeFilters.has("TODAS")) {
      const groupFilters = Array.from(activeFilters).filter((f) => f !== "DISPONÍVEIS")
      const hasAvailableFilter = activeFilters.has("DISPONÍVEIS")

      if (groupFilters.length > 0) {
        filtered = filtered.filter((p) => groupFilters.includes(p.grupo))
      }

      if (hasAvailableFilter) {
        filtered = filtered.filter((p) => p.disponivel)
      }
    }

    filtered.sort((a, b) => {
      const grupoA = Number.parseInt(a.grupo)
      const grupoB = Number.parseInt(b.grupo)
      const pecaA = Number.parseInt(a.peca)
      const pecaB = Number.parseInt(b.peca)

      if (grupoA !== grupoB) {
        return sortOrder === "desc" ? grupoB - grupoA : grupoA - grupoB
      }
      return sortOrder === "desc" ? pecaB - pecaA : pecaA - pecaB
    })

    return filtered
  }

  const favoriteCount = products.filter((p) => p.isFavorited).length
  const cartCount = selectedItems.length
  const totalPrice = selectedItems.reduce((sum, item) => sum + item.preco, 0)
  const favoriteItems = products.filter((p) => p.isFavorited)

  const getImageUrl = (produto: ProductReal) => {
    const primaryImage = produto.imagens[0] || `${produto.grupo}-${produto.peca}a.avif`
    return `http://betshoptv.com/img/tmb/${primaryImage}`
  }

  const getFallbackImageUrl = (produto: ProductReal) => {
    const primaryImage = produto.imagens[0] || `${produto.grupo}-${produto.peca}a.avif`
    const fallbackImage = primaryImage.replace(".avif", ".jpg")
    return `http://betshoptv.com/img/fallback/${fallbackImage}`
  }

  const distributeIntoColumns = (products: ProductReal[]) => {
    const columns: ProductReal[][] = [[], [], []]
    products.forEach((product, index) => {
      columns[index % 3].push(product)
    })
    return columns
  }

  if (loading) {
    const skeletonColumns = [[], [], []] as any[][]
    for (let i = 0; i < 12; i++) {
      skeletonColumns[i % 3].push({ id: `skeleton-${i}` })
    }

    return (
      <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "#bebab0" }}>
        <div className="text-white p-4 font-bold text-lg" style={{ backgroundColor: "#ff0000" }}>
          CABEÇALHO
        </div>

        <div className="w-full max-w-[1200px] mx-auto px-2 py-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <div
              className="px-4 py-2 text-sm font-bold border bg-gray-300 animate-pulse"
              style={{ width: "80px", height: "36px" }}
            ></div>
            <div
              className="px-4 py-2 text-sm font-bold border bg-gray-300 animate-pulse"
              style={{ width: "60px", height: "36px" }}
            ></div>
            <div
              className="px-4 py-2 text-sm font-bold border bg-gray-300 animate-pulse"
              style={{ width: "60px", height: "36px" }}
            ></div>
          </div>
        </div>

        <div className="w-full max-w-[1200px] mx-auto px-2 py-[42px]">
          <div className="flex gap-2 md:gap-4">
            {skeletonColumns.map((column, columnIndex) => (
              <div key={columnIndex} className="flex-1 flex flex-col">
                {column.map((_, index) => (
                  <ProductSkeleton key={`skeleton-${columnIndex}-${index}`} />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0">
          <div className="w-full max-w-[1200px] mx-auto px-2">
            <div
              className="flex items-stretch justify-between bg-gray-300 animate-pulse"
              style={{ height: "64px" }}
            ></div>
          </div>
        </div>

        <div className="h-16"></div>
      </div>
    )
  }

  if (error) {
    console.log("[v0] Showing error state:", error)
  }

  const filteredProducts = getFilteredProducts()
  const columns = distributeIntoColumns(filteredProducts)

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "#bebab0" }}>
      <div className="text-white p-4 font-bold text-lg" style={{ backgroundColor: "#ff0000" }}>
        CABEÇALHO
      </div>
      <div className="w-full max-w-[1200px] mx-auto px-2 py-4">
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => handleFilterClick("TODAS")}
            className="px-4 py-2 text-sm font-bold border"
            style={{
              backgroundColor: activeFilters.has("TODAS") ? "#2b2424" : "#bebab0",
              color: activeFilters.has("TODAS") ? "#bebab0" : "#2b2424",
              borderColor: "#2b2424",
            }}
          >
            TODAS
          </button>

          {availableGroups.map((grupo) => (
            <button
              key={grupo}
              onClick={() => handleFilterClick(grupo)}
              className="px-4 py-2 text-sm font-bold border"
              style={{
                backgroundColor: activeFilters.has(grupo) ? "#2b2424" : "#bebab0",
                color: activeFilters.has(grupo) ? "#bebab0" : "#2b2424",
                borderColor: "#2b2424",
              }}
            >
              {grupo.padStart(2, "0")}
            </button>
          ))}

          <button
            onClick={() => handleFilterClick("DISPONÍVEIS")}
            className="px-4 py-2 text-sm font-bold border"
            style={{
              backgroundColor: activeFilters.has("DISPONÍVEIS") ? "#2b2424" : "#bebab0",
              color: activeFilters.has("DISPONÍVEIS") ? "#bebab0" : "#2b2424",
              borderColor: "#2b2424",
            }}
          >
            DISPONÍVEIS
          </button>

          <button
            onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
            className="px-4 py-2 text-sm font-bold border"
            style={{
              backgroundColor: "#bebab0",
              color: "#2b2424",
              borderColor: "#2b2424",
            }}
          >
            {sortOrder === "desc" ? "+ RECENTES" : "- RECENTES"}
          </button>
        </div>
      </div>
      <div className="w-full max-w-[1200px] mx-auto px-2 py-[42px]">
        <div className="flex gap-2 md:gap-4">
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="flex-1 flex flex-col">
              {column.map((product) => (
                <div key={product.id} className="mb-3 sm:mb-4 md:mb-6">
                  <div className="relative border border-black" style={{ backgroundColor: "#ffffff" }}>
                    <img
                      src={getImageUrl(product) || "/placeholder.svg"}
                      alt={product.titulo}
                      className="w-full h-auto object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = getFallbackImageUrl(product)
                      }}
                    />
                    {product.disponivel ? (
                      <button
                        onClick={() => toggleFavorite(product.id)}
                        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center"
                      >
                        <img
                          src={
                            product.isFavorited
                              ? "http://betshoptv.com/elementos/ticon-FAV-ON-v.avif"
                              : "http://betshoptv.com/elementos/ticon-FAV-OFF-p2.avif"
                          }
                          alt="Favorite"
                          className="w-5 h-5"
                        />
                      </button>
                    ) : (
                      <div className="absolute bottom-2 right-2 w-6 h-6 flex items-center justify-center">
                        <span className="text-[rgba(255,0,0,1)] text-2xl mr-[-4px]" style={{ color: "#ff0000" }}>
                          ⬤
                        </span>
                      </div>
                    )}
                  </div>

                  {product.disponivel && (
                    <button
                      onClick={() => toggleCart(product.id)}
                      className="w-full font-bold border my-0 mt-[-1px] text-xs tracking-wide h-8 sm:h-9 md:h-[38px] px-2"
                      style={{
                        backgroundColor: product.isInCart ? "#2b2424" : "#bebab0",
                        color: product.isInCart ? "#bebab0" : "#2b2424",
                        borderColor: "#2b2424",
                      }}
                    >
                      {product.isInCart ? "REMOVER" : "ADICIONAR"}
                    </button>
                  )}
                  {!product.disponivel && (
                    <div className="mt-[-1px] sm:h-9 h-0 md:h-0" style={{ backgroundColor: "transparent" }}></div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {activeSection && (
        <div
          className="fixed left-1/2 transform -translate-x-1/2 border"
          style={{
            bottom: "64px", // No spacing - tabs connect directly to BARRA SHOPPING
            backgroundColor: "#bebab0",
            borderColor: "#2b2424",
            height: "128px", // Double the BARRA SHOPPING height (64px * 2)
            width: "calc(100vw - 16px)", // Same width calculation as gallery and shopping bar
            maxWidth: "1200px", // Same max width as BARRA SHOPPING and gallery
            padding: "8px", // Reduced padding for better thumbnail fit
            marginBottom: "0px",
            overflowX: "auto", // Always horizontal scroll
            overflowY: "hidden",
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              height: 8px;
            }
            div::-webkit-scrollbar-thumb {
              background-color: #ff0000;
            }
            div::-webkit-scrollbar-track {
              background: #bebab0;
            }
          `}</style>

          {activeSection === "rifas" && (
            <div className="h-full">
              {favoriteItems.length > 0 ? (
                <div
                  className="flex gap-3 h-full items-center"
                  style={{ minWidth: "max-content", paddingBottom: "4px", paddingTop: "4px" }}
                >
                  {favoriteItems.map((item) => (
                    <div key={item.id} className="relative flex-shrink-0">
                      <img
                        src={getImageUrl(item) || "/placeholder.svg"}
                        alt={item.titulo}
                        className="w-auto object-cover border border-black"
                        style={{
                          height: "112px", // 88% of 128px tab height
                          maxHeight: "112px",
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = getFallbackImageUrl(item)
                        }}
                      />
                      <button
                        onClick={() => toggleFavorite(item.id)}
                        className="absolute flex items-center justify-center"
                        style={{
                          top: "0px", // Aligned to top-right corner
                          right: "0px", // Aligned to top-right corner
                          width: "20px",
                          height: "20px",
                          backgroundColor: "#2b2424",
                          color: "#ffffff",
                          border: "1px solid #2b2424",
                          fontSize: "12px",
                          lineHeight: "1",
                        }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full" style={{ color: "#2b2424" }}>
                  <p className="font-bold text-center">
                    Nenhum número selecionado.
                    <br />
                    Aposte na RIFA!
                  </p>
                </div>
              )}
            </div>
          )}

          {activeSection === "ofertas" && (
            <div className="h-full">
              {selectedItems.length > 0 ? (
                <div
                  className="flex gap-3 h-full items-center"
                  style={{ minWidth: "max-content", paddingBottom: "4px", paddingTop: "4px" }}
                >
                  {selectedItems.map((item) => (
                    <div key={item.id} className="relative flex-shrink-0">
                      <img
                        src={getImageUrl(item) || "/placeholder.svg"}
                        alt={item.titulo}
                        className="w-auto object-cover border border-black"
                        style={{
                          height: "112px", // 88% of 128px tab height
                          maxHeight: "112px",
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = getFallbackImageUrl(item)
                        }}
                      />
                      <button
                        onClick={() => removeFromSelected(item.id)}
                        className="absolute flex items-center justify-center"
                        style={{
                          top: "0px", // Aligned to top-right corner
                          right: "0px", // Aligned to top-right corner
                          width: "20px",
                          height: "20px",
                          backgroundColor: "#2b2424",
                          color: "#ffffff",
                          border: "1px solid #2b2424",
                          fontSize: "12px",
                          lineHeight: "1",
                        }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full" style={{ color: "#2b2424" }}>
                  <p className="font-bold text-center">Nenhuma oferta selecionada.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <div className="fixed bottom-0 left-0 right-0">
        <div className="w-full max-w-[1200px] mx-auto px-2">
          <div className="flex items-stretch justify-between" style={{ backgroundColor: "#bebab0" }}>
            <div className="flex">
              <div
                className="flex flex-col cursor-pointer border py-3 px-4 sm:px-6 md:px-8 lg:px-12 justify-center items-center min-w-0"
                style={{
                  backgroundColor: activeSection === "rifas" ? "#ff0000" : "#bebab0",
                  color: activeSection === "rifas" ? "#ffffff" : "#2b2424",
                  borderColor: "#2b2424",
                }}
                onClick={() => handleSectionClick("rifas")}
              >
                <div className="text-xs font-bold mb-1 text-center">RIFAS</div>
                <div className="flex items-center justify-center gap-1 sm:gap-2 text-sm">
                  <img
                    src={
                      activeSection === "rifas"
                        ? "http://betshoptv.com/elementos/ticon-RIFA-b.avif"
                        : "http://betshoptv.com/elementos/ticon-RIFA-p.avif"
                    }
                    alt="Rifas"
                    className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0"
                  />
                  <span className="font-bold text-xs md:text-sm">04</span>
                  <img
                    src={
                      activeSection === "rifas"
                        ? "http://betshoptv.com/elementos/ticon-FAV-ON-b.avif"
                        : "http://betshoptv.com/elementos/ticon-FAV-ON-p.avif"
                    }
                    alt="Favorites"
                    className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0"
                  />
                  <span className="font-bold text-xs md:text-sm">
                    {favoriteCount === 0 ? "__" : favoriteCount.toString().padStart(2, "0")}
                  </span>
                </div>
              </div>

              <div
                className="flex border cursor-pointer flex-col items-center justify-center py-3 sm:px-6 md:px-8 lg:px-12 min-w-0 mr-0 px-3"
                style={{
                  backgroundColor: activeSection === "ofertas" ? "#ff0000" : "#bebab0",
                  color: activeSection === "ofertas" ? "#ffffff" : "#2b2424",
                  borderColor: "#2b2424",
                  borderLeft: "none",
                }}
                onClick={() => handleSectionClick("ofertas")}
              >
                <div className="text-xs font-bold mb-1 text-center">OFERTAS</div>
                <div className="flex items-center justify-center gap-1 sm:gap-2 text-sm">
                  <img
                    src={
                      activeSection === "ofertas"
                        ? "http://betshoptv.com/elementos/ticon-SHOP-b.avif"
                        : "http://betshoptv.com/elementos/ticon-SHOP-p.avif"
                    }
                    alt="Ofertas"
                    className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0"
                  />
                  <span className="font-bold text-xs md:text-sm">
                    {cartCount === 0 ? "__" : cartCount.toString().padStart(2, "0")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 max-w-0 sm:max-w-[100px] md:max-w-[200px] lg:max-w-[388px]"></div>

            <div className="flex">
              <div
                className="flex flex-col items-center border py-3 px-3 sm:px-4 md:px-6 lg:px-8 justify-center"
                style={{
                  backgroundColor: "#bebab0",
                  color: "#2b2424",
                  borderColor: "#2b2424",
                }}
              >
                <div className="text-xs font-bold mb-1 text-center whitespace-nowrap">TOTAL</div>
                <div className="text-xs md:text-sm font-bold text-center whitespace-nowrap">
                  R$ {totalPrice === 0 ? "__" : Math.round(totalPrice).toString()}
                </div>
              </div>

              <div
                className="flex border justify-center items-center py-3 px-3 sm:px-4 md:px-6 lg:px-8"
                style={{
                  backgroundColor: "#bebab0",
                  color: "#2b2424",
                  borderColor: "#2b2424",
                  borderLeft: "none",
                }}
              >
                <div className="text-xs font-bold text-center leading-tight whitespace-nowrap">
                  FINALIZAR
                  <br />
                  COMPRA
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={activeSection ? "h-44" : "h-16"}></div> {/* Reduced bottom spacing since tabs connect directly */}
    </div>
  )
}
