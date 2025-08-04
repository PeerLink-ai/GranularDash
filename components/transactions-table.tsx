"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ArrowUpRight, ArrowDownRight, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"

interface Transaction {
  id: string
  user_id: string
  name: string
  amount: number
  transaction_date: string
  type: "income" | "expense"
  category?: string
  description?: string
  created_at: string
}

export function TransactionsTable() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user])

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/transactions")
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
    } finally {
      setLoading(false)
    }
  }

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

  const handleAddTransaction = () => {
    // This would open a modal to add a new transaction
    alert("Add new transaction functionality would be implemented here")
  }

  const getTypeColor = (type: Transaction["type"]) => {
    return type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground">Loading transactions...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold">All Transactions</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative w-full max-w-sm">
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Button onClick={handleAddTransaction}>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                No transactions found. Add your first transaction to start tracking your finances.
              </div>
              <Button variant="outline" onClick={handleAddTransaction}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Transaction
              </Button>
            </div>
          ) : (
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
                        <TableCell>{new Date(transaction.transaction_date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{transaction.name}</TableCell>
                        <TableCell>
                          {transaction.category ? <Badge variant="secondary">{transaction.category}</Badge> : "-"}
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
                        No transactions match your search criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
              <span>
                {selectedTransaction ? new Date(selectedTransaction.transaction_date).toLocaleDateString() : ""}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Category:</span>
              <span>{selectedTransaction?.category || "-"}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Amount:</span>
              <span className={getTypeColor(selectedTransaction?.type || "expense")}>
                {selectedTransaction?.type === "income" ? "+" : "-"}$
                {Math.abs(selectedTransaction?.amount || 0).toFixed(2)}
              </span>
            </div>
            {selectedTransaction?.description && (
              <div className="col-span-2">
                <span className="font-medium">Description:</span>
                <p className="text-muted-foreground mt-1">{selectedTransaction.description}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
