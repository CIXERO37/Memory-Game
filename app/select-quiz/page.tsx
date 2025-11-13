"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, FileSearch, Search, Filter, Loader2, ChevronUp, ChevronDown, Check, Book, BookOpen, Beaker, Calculator, Clock, Globe, Languages, Laptop, Dumbbell, Film, Briefcase, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuizzes } from "@/hooks/use-quiz"
import { useTranslation } from "react-i18next"

// Categories and background images mapping
const categories = [
  {
    value: "all",
    label: "All Categories",
    icon: <Book className="h-4 w-4 text-blue-500" />,
    bgImage:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop&crop=entropy&auto=format&q=80",
  },
  {
    value: "general",
    label: "General",
    icon: <BookOpen className="h-4 w-4" />,
    bgImage:
      "https://images.unsplash.com/photo-1707926310424-f7b837508c40?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    value: "science",
    label: "Science",
    icon: <Beaker className="h-4 w-4 text-green-500" />,
    bgImage:
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    value: "math",
    label: "Mathematics",
    icon: <Calculator className="h-4 w-4 text-red-500" />,
    bgImage:
      "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    value: "history",
    label: "History",
    icon: <Clock className="h-4 w-4 text-yellow-500" />,
    bgImage:
      "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=800&h=600&fit=crop&crop=entropy&auto=format&q=80",
  },
  {
    value: "geography",
    label: "Geography",
    icon: <Globe className="h-4 w-4 text-teal-500" />,
    bgImage:
      "https://images.unsplash.com/photo-1592252032050-34897f779223?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    value: "language",
    label: "Language",
    icon: <Languages className="h-4 w-4 text-purple-500" />,
    bgImage:
      "https://images.unsplash.com/photo-1620969427101-7a2bb6d83273?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    value: "technology",
    label: "Technology",
    icon: <Laptop className="h-4 w-4 text-blue-500" />,
    bgImage:
      "https://plus.unsplash.com/premium_photo-1661963874418-df1110ee39c1?q=80&w=1086&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    value: "sports",
    label: "Sports",
    icon: <Dumbbell className="h-4 w-4 text-orange-500" />,
    bgImage:
      "https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    value: "entertainment",
    label: "Entertainment",
    icon: <Film className="h-4 w-4 text-pink-500" />,
    bgImage:
      "https://images.unsplash.com/photo-1470020618177-f49a96241ae7?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    value: "business",
    label: "Business",
    icon: <Briefcase className="h-4 w-4 text-indigo-500" />,
    bgImage:
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=600&fit=crop&crop=entropy&auto=format&q=80",
  },
];

// Helper function to get background image for category
const getCategoryBgImage = (category: string) => {
  const categoryLower = category?.toLowerCase() || 'general';
  const categoryData = categories.find(cat => 
    cat.value === categoryLower || 
    cat.label.toLowerCase() === categoryLower
  );
  return categoryData?.bgImage || categories[1].bgImage; // Default to General if not found
};

// Helper function to get category icon
const getCategoryIcon = (category: string) => {
  const categoryLower = category?.toLowerCase() || 'general';
  const categoryData = categories.find(cat => 
    cat.value === categoryLower || 
    cat.label.toLowerCase() === categoryLower
  );
  return categoryData?.icon || categories[1].icon; // Default to General if not found
};


export default function SelectQuizPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isSelectAllExpanded, setIsSelectAllExpanded] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6 // 2 rows x 3 columns
  
  // Fetch quizzes from Supabase
  const { quizzes: supabaseQuizzes, loading, error } = useQuizzes()

  // Helper function to translate category
  const translateCategory = (category: string | undefined) => {
    if (!category) return t('selectQuiz.categories.general')
    
    const categoryLower = category.toLowerCase()
    const categoryMap: { [key: string]: string } = {
      'general': 'general',
      'science': 'science',
      'mathematics': 'mathematics',
      'math': 'mathematics',
      'history': 'history',
      'geography': 'geography',
      'language': 'language',
      'technology': 'technology',
      'sports': 'sports',
      'entertainment': 'entertainment',
      'business': 'business'
    }
    
    const mappedCategory = categoryMap[categoryLower] || 'general'
    return t(`selectQuiz.categories.${mappedCategory}`)
  }

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setSearchTerm(searchInput)
    }
  }

  // Transform Supabase data to match existing interface
  const quizzes = useMemo(() => {
    return supabaseQuizzes
  }, [supabaseQuizzes])

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const matchesSearch = searchTerm === "" || 
                           quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (quiz.description && quiz.description.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = categoryFilter === "all" || quiz.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [quizzes, searchTerm, categoryFilter])

  // Pagination logic
  const totalPages = Math.ceil(filteredQuizzes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentQuizzes = filteredQuizzes.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, categoryFilter])

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
  }

  const handlePageClick = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show first page
      pages.push(1)
      
      if (currentPage > 3) {
        pages.push('...')
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i)
        }
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...')
      }
      
      // Show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  const handleQuizSelect = (quizId: string) => {
    // Navigate to settings page with quizId
    router.push(`/quiz-settings?quizId=${quizId}`)
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483)' }}>
      {/* Pixel Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="pixel-grid"></div>
      </div>
      
      {/* Retro Scanlines */}
      <div className="absolute inset-0 opacity-10">
        <div className="scanlines"></div>
      </div>
      
      {/* Floating Pixel Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <PixelBackgroundElements />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-4 sm:py-8">
        {/* Pixel Header */}
        <div className="relative flex items-center justify-between gap-2 sm:gap-4 mb-6 sm:mb-8">
          {/* Left side - Back Button and Memory Quiz Logo */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <Link href="/">
              <div className="relative pixel-button-container">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                <Button variant="outline" size="default" className="relative bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg text-white hover:bg-gradient-to-br hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200 h-10 w-10 min-h-[44px] min-w-[44px]">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
            </Link>
            {/* Memory Quiz Logo with glow effect */}
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <img 
                draggable={false}
                src="/images/memoryquiz.webp" 
                alt="Memory Quiz" 
                className="h-8 sm:h-12 md:h-16 lg:h-20 xl:h-24 w-auto object-contain"
                style={{ 
                  filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5)) drop-shadow(0 4px 12px rgba(0,0,0,0.6))',
                }}
              />
            </div>
          </div>
          
          {/* Center - Title */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <div className="inline-block bg-white border-2 border-black rounded px-2 sm:px-3 py-1 sm:py-2 pixel-header-title">
              <h1 className="text-lg sm:text-xl font-bold text-black">{t('selectQuiz.title')}</h1>
            </div>
          </div>
          
          {/* Right side - GameForSmart Logo with glow effect */}
          <div className="flex-shrink-0">
            <img 
              draggable={false}
              src="/images/gameforsmartlogo.webp" 
              alt="GameForSmart Logo" 
              className="h-8 sm:h-12 md:h-16 lg:h-20 xl:h-24 w-auto object-contain"
              style={{ 
                filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5)) drop-shadow(0 4px 12px rgba(0,0,0,0.6)) drop-shadow(0 0 16px rgba(255,165,0,0.4))',
              }}
            />
          </div>
        </div>

        {/* Quiz Selector Content */}
        <div className="max-w-4xl mx-auto">
          {/* Pixel Search and Filter Section */}
          <div className="mb-6 sm:mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Pixel Search Input */}
              <div className="relative flex-1">
                <div className="inline-block bg-white border border-black rounded px-2 py-1 mb-2">
                  <label className="text-black font-bold text-xs sm:text-sm">{t('selectQuiz.searchLabel')}</label>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 border border-black rounded flex items-center justify-center">
                    <Search className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <Input
                    placeholder={t('selectQuiz.searchPlaceholder')}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleSearch}
                    className="pl-10 sm:pl-12 h-10 sm:h-10 bg-white border-2 border-black rounded-none shadow-lg font-mono text-sm sm:text-base text-black placeholder:text-gray-500 focus:border-blue-600"
                  />
                </div>
              </div>
              
              {/* Pixel Category Filter */}
              <div className="sm:w-56">
                <div className="inline-block bg-white border border-black rounded px-2 py-1 mb-2">
                  <label className="text-black font-bold text-xs sm:text-sm">{t('selectQuiz.categoriesLabel')}</label>
                </div>
                <div className="relative">
                  <div className="relative">
                    <Button
                      onClick={() => setIsSelectAllExpanded(!isSelectAllExpanded)}
                      className="w-full h-10 bg-white border-2 border-black rounded-none shadow-lg text-sm sm:text-base text-black hover:bg-gray-100 focus:border-blue-600 flex items-center justify-between px-3 min-h-[44px]"
                    >
                      <div className="flex items-center">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 mr-2 flex items-center justify-center">
                          {getCategoryIcon(categoryFilter === "all" ? "all" : categoryFilter)}
                        </div>
                        <span className="font-bold text-xs sm:text-sm">
                          {categoryFilter === "all" ? t('selectQuiz.allCategories') : 
                           categoryFilter === "General" ? t('selectQuiz.categories.general') :
                           categoryFilter === "Science" ? t('selectQuiz.categories.science') :
                           categoryFilter === "Mathematics" ? t('selectQuiz.categories.mathematics') :
                           categoryFilter === "History" ? t('selectQuiz.categories.history') :
                           categoryFilter === "Geography" ? t('selectQuiz.categories.geography') :
                           categoryFilter === "Language" ? t('selectQuiz.categories.language') :
                           categoryFilter === "Technology" ? t('selectQuiz.categories.technology') :
                           categoryFilter === "Sports" ? t('selectQuiz.categories.sports') :
                           categoryFilter === "Entertainment" ? t('selectQuiz.categories.entertainment') :
                           categoryFilter === "Business" ? t('selectQuiz.categories.business') : categoryFilter.toUpperCase()}
                        </span>
                      </div>
                      {isSelectAllExpanded ? (
                        <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </Button>
                    
                    {/* Custom Dropdown Menu */}
                    {isSelectAllExpanded && (
                      <div className="absolute top-full left-0 right-0 z-50 bg-white border-2 border-black shadow-lg mt-1 max-h-[220px] overflow-y-auto">
                        <button
                          onClick={() => {
                            setCategoryFilter("all")
                            setIsSelectAllExpanded(false)
                          }}
                          className={`w-full text-left px-3 py-2 text-sm sm:text-base hover:bg-gray-200 flex items-center justify-between min-h-[44px] ${
                            categoryFilter === "all" ? "bg-gray-200" : "text-black"
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="w-4 h-4 mr-2 text-blue-500">
                              {getCategoryIcon("all")}
                            </div>
                            <span>{t('selectQuiz.allCategories')}</span>
                          </div>
                          {categoryFilter === "all" && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setCategoryFilter("General")
                            setIsSelectAllExpanded(false)
                          }}
                          className={`w-full text-left px-3 py-2 text-sm sm:text-base hover:bg-blue-200 flex items-center justify-between min-h-[44px] ${
                            categoryFilter === "General" ? "bg-blue-200" : "text-black"
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="w-4 h-4 mr-2 text-black">
                              {getCategoryIcon("General")}
                            </div>
                            <span>{t('selectQuiz.categories.general')}</span>
                          </div>
                          {categoryFilter === "General" && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setCategoryFilter("Science")
                            setIsSelectAllExpanded(false)
                          }}
                          className={`w-full text-left px-3 py-2 text-sm sm:text-base hover:bg-green-200 flex items-center justify-between min-h-[44px] ${
                            categoryFilter === "Science" ? "bg-green-200" : "text-black"
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="w-4 h-4 mr-2 text-green-500">
                              {getCategoryIcon("Science")}
                            </div>
                            <span>{t('selectQuiz.categories.science')}</span>
                          </div>
                          {categoryFilter === "Science" && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setCategoryFilter("Mathematics")
                            setIsSelectAllExpanded(false)
                          }}
                          className={`w-full text-left px-3 py-2 text-sm sm:text-base hover:bg-red-200 flex items-center justify-between min-h-[44px] ${
                            categoryFilter === "Mathematics" ? "bg-red-200" : "text-black"
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="w-4 h-4 mr-2 text-red-500">
                              {getCategoryIcon("Mathematics")}
                            </div>
                            <span>{t('selectQuiz.categories.mathematics')}</span>
                          </div>
                          {categoryFilter === "Mathematics" && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setCategoryFilter("History")
                            setIsSelectAllExpanded(false)
                          }}
                          className={`w-full text-left px-3 py-2 text-sm sm:text-base hover:bg-yellow-200 flex items-center justify-between min-h-[44px] ${
                            categoryFilter === "History" ? "bg-yellow-200" : "text-black"
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="w-4 h-4 mr-2 text-yellow-500">
                              {getCategoryIcon("History")}
                            </div>
                            <span>{t('selectQuiz.categories.history')}</span>
                          </div>
                          {categoryFilter === "History" && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setCategoryFilter("Geography")
                            setIsSelectAllExpanded(false)
                          }}
                          className={`w-full text-left px-3 py-2 text-sm sm:text-base hover:bg-teal-200 flex items-center justify-between min-h-[44px] ${
                            categoryFilter === "Geography" ? "bg-teal-200" : "text-black"
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="w-4 h-4 mr-2 text-teal-500">
                              {getCategoryIcon("Geography")}
                            </div>
                            <span>{t('selectQuiz.categories.geography')}</span>
                          </div>
                          {categoryFilter === "Geography" && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setCategoryFilter("Language")
                            setIsSelectAllExpanded(false)
                          }}
                          className={`w-full text-left px-3 py-2 text-sm sm:text-base hover:bg-purple-200 flex items-center justify-between min-h-[44px] ${
                            categoryFilter === "Language" ? "bg-purple-200" : "text-black"
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="w-4 h-4 mr-2 text-purple-500">
                              {getCategoryIcon("Language")}
                            </div>
                            <span>{t('selectQuiz.categories.language')}</span>
                          </div>
                          {categoryFilter === "Language" && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setCategoryFilter("Technology")
                            setIsSelectAllExpanded(false)
                          }}
                          className={`w-full text-left px-3 py-2 text-sm sm:text-base hover:bg-blue-200 flex items-center justify-between min-h-[44px] ${
                            categoryFilter === "Technology" ? "bg-blue-200" : "text-black"
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="w-4 h-4 mr-2 text-blue-500">
                              {getCategoryIcon("Technology")}
                            </div>
                            <span>{t('selectQuiz.categories.technology')}</span>
                          </div>
                          {categoryFilter === "Technology" && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setCategoryFilter("Sports")
                            setIsSelectAllExpanded(false)
                          }}
                          className={`w-full text-left px-3 py-2 text-sm sm:text-base hover:bg-orange-200 flex items-center justify-between min-h-[44px] ${
                            categoryFilter === "Sports" ? "bg-orange-200" : "text-black"
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="w-4 h-4 mr-2 text-orange-500">
                              {getCategoryIcon("Sports")}
                            </div>
                            <span>{t('selectQuiz.categories.sports')}</span>
                          </div>
                          {categoryFilter === "Sports" && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setCategoryFilter("Entertainment")
                            setIsSelectAllExpanded(false)
                          }}
                          className={`w-full text-left px-3 py-2 text-sm sm:text-base hover:bg-pink-200 flex items-center justify-between min-h-[44px] ${
                            categoryFilter === "Entertainment" ? "bg-pink-200" : "text-black"
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="w-4 h-4 mr-2 text-pink-500">
                              {getCategoryIcon("Entertainment")}
                            </div>
                            <span>{t('selectQuiz.categories.entertainment')}</span>
                          </div>
                          {categoryFilter === "Entertainment" && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setCategoryFilter("Business")
                            setIsSelectAllExpanded(false)
                          }}
                          className={`w-full text-left px-3 py-2 text-sm sm:text-base hover:bg-purple-200 flex items-center justify-between min-h-[44px] ${
                            categoryFilter === "Business" ? "bg-purple-200" : "text-black"
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="w-4 h-4 mr-2 text-indigo-500">
                              {getCategoryIcon("Business")}
                            </div>
                            <span>{t('selectQuiz.categories.business')}</span>
                          </div>
                          {categoryFilter === "Business" && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 justify-items-center">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                  <div className="relative bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg border-4 border-black shadow-2xl p-6">
                    <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                      <Loader2 className="h-8 w-8 text-black animate-spin" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{t('selectQuiz.loading')}</h3>
                    <p className="text-white/80 text-sm">{t('selectQuiz.loadingDescription')}</p>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="col-span-full text-center py-12">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                  <div className="relative bg-gradient-to-br from-red-500 to-red-600 rounded-lg border-4 border-black shadow-2xl p-6">
                    <div className="w-16 h-16 mx-auto bg-white border-2 border-black rounded flex items-center justify-center mb-4">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{t('selectQuiz.errorTitle')}</h3>
                    <p className="text-white/80 mb-4 text-sm">{error}</p>
                    <div className="text-white/60 text-xs mb-4 space-y-2">
                      <p><strong>{t('selectQuiz.errorSolution')}</strong></p>
                      <p>{t('selectQuiz.errorStep1')}</p>
                      <p>{t('selectQuiz.errorStep2')}</p>
                      <p>{t('selectQuiz.errorStep3')}</p>
                      <p>{t('selectQuiz.errorStep4')}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => window.location.reload()} 
                        className="bg-white text-red-600 px-4 py-2 rounded font-bold hover:bg-gray-100 transition-colors"
                      >
                        {t('selectQuiz.retry')}
                      </button>
                      <button 
                        onClick={() => window.open('https://supabase.com/dashboard', '_blank')} 
                        className="bg-blue-500 text-white px-4 py-2 rounded font-bold hover:bg-blue-600 transition-colors"
                      >
                        {t('selectQuiz.supabaseDashboard')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : filteredQuizzes.length === 0 ? (
              <div className="col-span-full text-center py-12">
                {/* Enhanced Empty State Card with Unique Animations */}
                <div className="relative inline-block mb-6">
                  {/* Multiple layered shadows for depth */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl transform rotate-1 pixel-button-shadow"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-pink-500 rounded-2xl transform rotate-2 opacity-50 pixel-button-shadow"></div>
                  
                  {/* Main card with morphing background */}
                  <div className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl border-4 border-white/20 shadow-2xl p-8 overflow-hidden morphing-card">
                    {/* Animated background pattern */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="floating-pattern"></div>
                    </div>
                    
                    {/* Holographic shimmer effect */}
                    <div className="absolute inset-0 holographic-shimmer"></div>
                    
                    {/* Glitch effect overlay */}
                    <div className="absolute inset-0 glitch-overlay"></div>
                    
                    {/* Interactive search icon with unique animations */}
                    <div className="relative z-10">
                      <div className="w-20 h-20 mx-auto mb-6 relative">
                        {/* Pulsing rings around the icon */}
                        <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-pulse-ring"></div>
                        <div className="absolute inset-0 rounded-full border-2 border-white/50 animate-pulse-ring-delayed"></div>
                        
                        {/* Main icon container with liquid morphing */}
                        <div className="relative w-full h-full bg-white/90 border-3 border-white rounded-2xl flex items-center justify-center liquid-morph">
                          {/* Floating particles inside icon */}
                          <div className="absolute inset-0">
                            <div className="absolute top-2 left-2 w-1 h-1 bg-blue-500 rounded-full animate-float-particle"></div>
                            <div className="absolute top-4 right-3 w-1 h-1 bg-purple-500 rounded-full animate-float-particle-delayed"></div>
                            <div className="absolute bottom-3 left-3 w-1 h-1 bg-pink-500 rounded-full animate-float-particle-slow"></div>
                            <div className="absolute bottom-2 right-2 w-1 h-1 bg-cyan-500 rounded-full animate-float-particle-slower"></div>
                          </div>
                          
                          {/* Search icon with breathing animation */}
                          <Search className="h-10 w-10 text-black animate-breathe relative z-10" />
                        </div>
                      </div>
                      
                      {/* Enhanced text with staggered animations */}
                      <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-white mb-3 animate-text-reveal">
                          {t('selectQuiz.noQuizzesFound').split('').map((char, index) => (
                            <span key={index} className={`inline-block animate-text-wave-delayed-${index}`}>
                              {char === ' ' ? '\u00A0' : char}
                            </span>
                          ))}
                        </h3>
                        
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 animate-text-slide-up">
                          <p className="text-white/90 text-base font-medium leading-relaxed">
                            {t('selectQuiz.noQuizzesDescription')}
                          </p>
                        </div>
                      </div>
                      
                      {/* Interactive floating elements */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-4 left-4 w-2 h-2 bg-yellow-400 rounded-full animate-orbit-slow"></div>
                        <div className="absolute top-8 right-6 w-1.5 h-1.5 bg-green-400 rounded-full animate-orbit-medium"></div>
                        <div className="absolute bottom-6 left-8 w-2.5 h-2.5 bg-red-400 rounded-full animate-orbit-fast"></div>
                        <div className="absolute bottom-4 right-4 w-1 h-1 bg-blue-400 rounded-full animate-orbit-slower"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              currentQuizzes.map((quiz) => {
                const categoryBgImage = getCategoryBgImage(quiz.category || 'General');
                const categoryColor = quiz.category === 'General' ? 'bg-blue-500' : 
                                    quiz.category === 'Science' ? 'bg-green-500' :
                                    quiz.category === 'Mathematics' ? 'bg-red-500' :
                                    quiz.category === 'History' ? 'bg-yellow-500' :
                                    quiz.category === 'Geography' ? 'bg-teal-500' :
                                    quiz.category === 'Language' ? 'bg-purple-500' :
                                    quiz.category === 'Technology' ? 'bg-blue-500' :
                                    quiz.category === 'Sports' ? 'bg-orange-500' :
                                    quiz.category === 'Entertainment' ? 'bg-pink-500' :
                                    quiz.category === 'Business' ? 'bg-purple-500' : 'bg-gray-500'
                return (
                  <div
                    key={quiz.id}
                    className="relative cursor-pointer transition-all duration-300 hover:-translate-y-1 pixel-quiz-card-container"
                    onClick={() => handleQuizSelect(quiz.id)}
                  >
                    <div 
                      className="relative pixel-quiz-card bg-cover bg-center bg-no-repeat"
                      style={{
                        backgroundImage: `url(${categoryBgImage})`,
                      }}
                    >
                      {/* Light overlay for better text readability */}
                      <div className="absolute inset-0 bg-black/20 z-0"></div>
                      
                      {/* Mobile Layout - Stacked */}
                      <div className="sm:hidden flex flex-col h-full p-2 overflow-hidden relative z-10">
                        {/* Header with title and category */}
                        <div className="flex items-start justify-between mb-2 gap-1">
                          <div className="bg-white border-2 border-black rounded px-1.5 py-0.5 shadow-lg flex-1 min-w-0 overflow-hidden">
                            <h3 className="text-xs font-bold text-black leading-tight overflow-hidden mobile-title-ellipsis">
                              {quiz.title.toUpperCase()}
                            </h3>
                          </div>
                          <div className={`${categoryColor} border-2 border-black rounded px-1 py-0.5 shadow-xl flex-shrink-0`}>
                            <div className="flex items-center gap-0.5">
                              <div className="w-1 h-1 bg-white rounded-full"></div>
                              <span className="text-white font-bold text-xs">
                                {translateCategory(quiz.category)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Description */}
                        <div className="bg-black/20 border border-white/30 rounded px-1.5 py-0.5 mb-2 flex-1 min-h-0 overflow-hidden">
                          <div className="mobile-description-scroll">
                            <p className="text-xs text-white font-medium leading-tight">
                              {quiz.description?.toUpperCase() || ''}
                            </p>
                          </div>
                        </div>
                        
                        {/* Question count */}
                        <div className="bg-blue-500 border-2 border-black rounded px-1.5 py-0.5 overflow-hidden">
                          <div className="text-xs text-white font-bold break-words overflow-hidden">
                            {quiz.questions.length} {t('selectQuiz.questions')}
                          </div>
                        </div>
                      </div>

                      {/* Desktop Layout - Original */}
                      <div className="hidden sm:flex absolute inset-0 flex-col justify-center items-center text-center px-4 z-20">
                        {/* Pixel Category badge */}
                        <div className={`absolute -top-2 -right-2 ${categoryColor} border-2 border-black rounded-lg px-2 py-1 shadow-xl z-20 transform rotate-3`}>
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            <span className="text-white font-bold text-xs tracking-wide">
                              {translateCategory(quiz.category)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-white border-2 border-black rounded px-3 py-1 mb-2 shadow-lg">
                          <h3 className="text-base font-bold text-black">
                            {quiz.title.toUpperCase()}
                          </h3>
                        </div>
                        <div className="bg-black/20 border border-white/30 rounded px-2 py-1 mb-3">
                          <p className="text-xs text-white font-medium leading-relaxed">
                            {quiz.description?.toUpperCase() || ''}
                          </p>
                        </div>
                        <div className="bg-blue-500 border-2 border-black rounded px-2 py-1">
                          <div className="text-xs text-white font-bold">
                            {quiz.questions.length} {t('selectQuiz.questions')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Retro Gaming Style Pagination with Modern Structure */}
          {!loading && !error && filteredQuizzes.length > itemsPerPage && (
            <div className="mt-8 flex justify-center">
              <div className="relative pixel-button-container">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-700 rounded-lg transform rotate-1 pixel-button-shadow"></div>
                <div className="relative bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg border-4 border-black shadow-2xl p-3">
                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className={`flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 border-2 border-black ${
                        currentPage === 1
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-green-500 text-white hover:bg-green-400 hover:scale-105'
                      }`}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {generatePageNumbers().map((page, index) => (
                        <div key={index}>
                          {page === '...' ? (
                            <span className="px-2 py-1 text-white text-sm font-bold">...</span>
                          ) : (
                            <button
                              onClick={() => handlePageClick(page as number)}
                              className={`flex items-center justify-center w-8 h-8 rounded-md text-sm font-bold transition-all duration-200 border-2 border-black ${
                                currentPage === page
                                  ? 'bg-purple-400 text-black shadow-lg scale-110'
                                  : 'bg-white text-black hover:bg-gray-200 hover:scale-105'
                              }`}
                            >
                              {page}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className={`flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 border-2 border-black ${
                        currentPage === totalPages
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-green-500 text-white hover:bg-green-400 hover:scale-105'
                      }`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PixelBackgroundElements() {
  const pixels = [
    { id: 1, color: 'bg-red-500', size: 'w-2 h-2', delay: '0s', duration: '3s', x: '10%', y: '20%' },
    { id: 2, color: 'bg-blue-500', size: 'w-3 h-3', delay: '1s', duration: '4s', x: '80%', y: '30%' },
    { id: 3, color: 'bg-green-500', size: 'w-2 h-2', delay: '2s', duration: '3.5s', x: '20%', y: '70%' },
    { id: 4, color: 'bg-yellow-500', size: 'w-4 h-4', delay: '0.5s', duration: '5s', x: '70%', y: '10%' },
    { id: 5, color: 'bg-purple-500', size: 'w-2 h-2', delay: '1.5s', duration: '4.5s', x: '50%', y: '80%' },
    { id: 6, color: 'bg-pink-500', size: 'w-3 h-3', delay: '2.5s', duration: '3s', x: '30%', y: '50%' },
    { id: 7, color: 'bg-cyan-500', size: 'w-2 h-2', delay: '0.8s', duration: '4s', x: '90%', y: '60%' },
    { id: 8, color: 'bg-orange-500', size: 'w-3 h-3', delay: '1.8s', duration: '3.8s', x: '15%', y: '40%' },
    { id: 9, color: 'bg-lime-500', size: 'w-2 h-2', delay: '2.2s', duration: '4.2s', x: '60%', y: '25%' },
    { id: 10, color: 'bg-indigo-500', size: 'w-4 h-4', delay: '0.3s', duration: '5.5s', x: '85%', y: '75%' },
  ]

  return (
    <>
      {pixels.map((pixel) => (
        <div
          key={pixel.id}
          className={`absolute ${pixel.color} ${pixel.size} pixel-float`}
          style={{
            left: pixel.x,
            top: pixel.y,
            animationDelay: pixel.delay,
            animationDuration: pixel.duration,
          }}
        />
      ))}
      
      {/* Floating Pixel Blocks */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 opacity-30 pixel-block-float">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
      <div className="absolute top-40 right-20 w-12 h-12 bg-gradient-to-br from-green-400 to-cyan-400 opacity-40 pixel-block-float-delayed">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
      <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-red-400 to-pink-400 opacity-35 pixel-block-float-slow">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
      <div className="absolute bottom-20 right-1/3 w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-400 opacity-45 pixel-block-float-delayed-slow">
        <div className="w-full h-full border-2 border-white/50"></div>
      </div>
    </>
  )
}


// ikan