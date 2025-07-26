"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

type Transaction = {
  id: string | number
  name: string
  amount: number
  date: string
  type: "income" | "expense"
  category?: string
  description?: string
}

const initialTransactions: Transaction[] = [
  {
    id: 1,
    name: "Amazon.com",
    amount: -129.99,
    date: "2023-07-15",
    type: "expense",
    category: "Shopping",
    description: "Online purchase of electronics.",
  },
  {
    id: 2,
    name: "Whole Foods Market",
    amount: -89.72,
    date: "2023-07-10",
    type: "expense",
    category: "Groceries",
    description: "Weekly grocery shopping.",
  },
  {
    id: 3,
    name: "Netflix Subscription",
    amount: -15.99,
    date: "2023-07-05",
    type: "expense",
    category: "Entertainment",
    description: "Monthly streaming service subscription.",
  },
  {
    id: 4,
    name: "Freelance Payment",
    amount: 750,
    date: "2023-07-12",
    type: "income",
    category: "Work",
    description: "Payment for web development project.",
  },
  {
    id: 5,
    name: "Gas Station",
    amount: -45.5,
    date: "2023-07-18",
    type: "expense",
    category: "Transport",
    description: "Fuel for car.",
  },
  {
    id: 6,
    name: "Salary",
    amount: 3500,
    date: "2023-07-01",
    type: "income",
    category: "Work",
    description: "Monthly salary deposit.",
  },
  {
    id: 7,
    name: "Starbucks",
    amount: -5.75,
    date: "2023-07-16",
    type: "expense",
    category: "Food",
    description: "Morning coffee.",
  },
  {
    id: 8,
    name: "Gym Membership",
    amount: -30.0,
    date: "2023-07-02",
    type: "expense",
    category: "Health",
    description: "Monthly gym fee.",
  },
  {
    id: 9,
    name: "Investment Dividend",
    amount: 120.5,
    date: "2023-07-20",
    type: "income",
    category: "Investment",
    description: "Quarterly dividend payout.",
  },
  {
    id: 10,
    name: "Utility Bill",
    amount: -75.0,
    date: "2023-07-22",
    type: "expense",
    category: "Bills",
    description: "Electricity bill.",
  },
]

export function TransactionsTable() {
  const [transactions, setTransactions] = useState(initialTransactions)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsDetailsModalOpen(true)
  }

  const getTypeColor = (type: Transaction["type"]) => {
    return type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">All Transactions</CardTitle>
        <div className="relative w-full max-w-sm">
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell className="font-medium">{transaction.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{transaction.category}</Badge>
                    </TableCell>
                    <TableCell className={getTypeColor(transaction.type)}>
                      {transaction.type === "income" ? "+" : "-"}${Math.abs(transaction.amount).toFixed(2)}
                      {transaction.type === "income" ? (
                        <ArrowUpRight className="inline-block h-4 w-4 ml-1" />
                      ) : (
                        <ArrowDownRight className="inline-block h-4 w-4 ml-1" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(transaction)}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Transaction Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>Comprehensive information about the selected transaction.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-sm">
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Name:</span>
              <span>{selectedTransaction?.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Date:</span>
              <span>{selectedTransaction?.date}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Category:</span>
              <span>{selectedTransaction?.category}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Amount:</span>
              <span className={getTypeColor(selectedTransaction?.type || "expense")}>
                {selectedTransaction?.type === "income" ? "+" : "-"}$
                {Math.abs(selectedTransaction?.amount || 0).toFixed(2)}
              </span>
            </div>
            {selectedTransaction?.description && (
              <>
                <div className="col-span-2">
                  <span className="font-medium">Description:</span>
                  <p className="text-muted-foreground mt-1">{selectedTransaction.description}</p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
