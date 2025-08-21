 { /* import { useEffect, useState } from "react";
import "./index.css"
import { Link } from "react-router";
import { fetchQuestions } from "@/api/questions";
//import type { Question } from "@/types/questions";

//mport { Card, CardContent } from "@/components/ui/card";


const BASE_URL = "https://qoverflow.api.hscc.bdpa.org/v1"



interface Question {
  id: number;
  title: string;
  upvotes: number;
  views: number;
  comments: number;
  answers: number;
  creator: string;
  createdAt: string;
}


export default function Buffety() {
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [sorting, setSorting] = useState("d");

    const fakeQuestions: Question[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  title: `Sample Question ${i + 1}`,
  upvotes: Math.floor(Math.random() * 100),
  views: Math.floor(Math.random() * 500),
  comments: Math.floor(Math.random() * 20),
  answers: Math.floor(Math.random() * 10),
  creator: `User${i + 1}`,
  createdAt: new Date(Date.now() - i * 10000000).toLocaleDateString(),
}));
type SortType = "u" | "uvc" | "uvac";

const sortFunctions: Record<SortType, (a: Question, b: Question) => number> = {
  u: (a, b) => b.upvotes - a.upvotes,
  uvc: (a, b) => (b.upvotes + b.views + b.comments) - (a.upvotes + a.views + a.comments),
  uvac: (a, b) => (b.upvotes + b.views + b.answers + b.comments) - (a.upvotes + a.views + a.answers + a.comments),
};

    // there are 3 types of sorting: u (by most upvotes; labeled as "Best"), uvc(by most upvotes, views, and comments; labeled as "Interesting"), and uvac (by most upvotes, views, answers and comments; labeled as "Hottest")
    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true);

            try {
                const response = await fetchQuestions(sorting);
                setQuestions(response);
            } catch (error: any) {
                setError(error);
            } finally{
                setIsLoading(false);
            }
            
        };

        fetchPosts();
    }, [sorting]);

    const getButtonClass = (value: string) =>
        sorting === value ? "sort-button active" : "sort-button";

    if (isLoading) {
        return <div>Loading...</div>
    }

    if (error) {
        return <div>Something went wrong. Try Again.</div>
    }

    return 
    {/*<>
        <h1>Buffet</h1>
        <div></div>
        <div className="sort-controls ">
            <span>Sort by:</span>
            <button onClick={() => setSorting("d")} className={getButtonClass("d")} style={{backgroundColor: sorting === "d" ? "grey" : "white"}}>
                Latest
            </button>
            <button onClick={() => setSorting("u")} className={getButtonClass("u")} style={{backgroundColor: sorting === "u" ? "grey" : "white"}}>
                Best
            </button>
            <button onClick={() => setSorting("uvc")} className={getButtonClass("uvc")} style={{backgroundColor: sorting === "uvc" ? "grey" : "white"}}>
                Interesting
            </button>
            <button onClick={() => setSorting("uvac")} className={getButtonClass("uvac")} style={{backgroundColor: sorting === "uvac" ? "grey" : "white"}}>
                Hottest
            </button>
        </div>
        <ul>
            {questions.map((question) => (
                <li key={question.question_id}>
                    <Link to={`/QA/${question.question_id}`}>
                        <div><strong>{question.title}</strong></div>
                        <div>Upvotes: {question.upvotes}</div>
                        <div>Views: {question.views}</div>
                        <div>Comments: {question.comments}</div>
                        <div>By: {question.creator}</div>
                        <div>ID: {question.question_id}</div>
                        <div>Date: {new Date(question.createAt).toLocaleString()}</div>
                    </Link>
                </li>
            ))}
        </ul>
    </>
(






  const [sortType, setSortType] = useState<SortType>("u");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const questionsPerPage = 10;

  const sortedQuestions = [...fakeQuestions].sort(sortFunctions[sortType]);
  const indexOfLast = currentPage * questionsPerPage;
  const indexOfFirst = indexOfLast - questionsPerPage;
  const currentQuestions = sortedQuestions.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(fakeQuestions.length / questionsPerPage);

  return (
    <div className="p-4 space-y-4">
      <div className="flex space-x-2 mb-4">
        <button onClick={() => setSortType("u")}>Best</button>
        <button onClick={() => setSortType("uvc")}>Interesting</button>
        <button onClick={() => setSortType("uvac")}>Hottest</button>
      </div>

      <div className="space-y-2">
        {currentQuestions.map((q) => (
          <a href={`/questions/${q.id}`} key={q.id}>
            <Card className="hover:shadow-lg transition-all">
              <CardContent className="p-4">
                <div className="text-xl font-semibold">{q.title}</div>
                <div className="text-sm text-gray-500">
                  Upvotes: {q.upvotes} | Views: {q.views} | Comments: {q.comments} | Creator: {q.creator} | Date: {q.createdAt}
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      <div className="flex justify-center space-x-1 mt-4">
        {currentPage > 2 && <span className="px-2">...</span>}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((num) => num === 1 || num === totalPages || Math.abs(num - currentPage) <= 1)
          .map((num) => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
            >
              {num}
            </button>
          ))}
        {currentPage < totalPages - 1 && <span className="px-2">...</span>}
      </div>
    </div>
  );

  */}
