import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { fetchItems } from "@/components/actions/items-action";
import { DeleteButton } from "./deleteButton";
import { ReadItemResponse } from "@/app/openapi-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { FileText, Plus, MoreHorizontal, Activity, Users, Package } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const items = (await fetchItems()) as ReadItemResponse;

  return (
    <SidebarInset className="flex-1">
      <header className="flex h-16 shrink-0 items-center gap-4 border-b border-gray-100 px-6 bg-white">
        <SidebarTrigger className="text-gray-600" />
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
            Admin Panel
          </Badge>
        </div>
      </header>

      <main className="flex-1 p-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="gradient-card-blue text-white border-0 shadow-lg rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <Badge className="bg-white/20 text-white border-0 font-medium">Active</Badge>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-white/90">Total Items</h3>
                <div className="text-3xl font-bold">{items.length}</div>
                <p className="text-sm text-white/70">Managed items</p>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card-green text-white border-0 shadow-lg rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <Badge className="bg-white/20 text-white border-0 font-medium">Live</Badge>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-white/90">Active Items</h3>
                <div className="text-3xl font-bold">{items.filter(item => (item.quantity ?? 0) > 0).length}</div>
                <p className="text-sm text-white/70">In stock</p>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card-purple text-white border-0 shadow-lg rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <Badge className="bg-white/20 text-white border-0 font-medium">100%</Badge>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-white/90">Management</h3>
                <div className="text-3xl font-bold">Online</div>
                <p className="text-sm text-white/70">System status</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer group">
            <CardContent className="p-6 text-center">
              <Link href="/dashboard/add-item" className="block">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Add Item</h3>
                <p className="text-sm text-gray-600">Create new items</p>
              </Link>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer group">
            <CardContent className="p-6 text-center">
              <Link href="/dashboard/colpali" className="block">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">ColPali Search</h3>
                <p className="text-sm text-gray-600">AI document search</p>
              </Link>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Analytics</h3>
              <p className="text-sm text-gray-600">View insights</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Settings</h3>
              <p className="text-sm text-gray-600">Configure system</p>
            </CardContent>
          </Card>
        </div>

        {/* Items Table */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Items Management</CardTitle>
                <CardDescription className="text-gray-600">
                  View and manage all your items
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table className="min-w-full text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!items.length ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      No items found. <Link href="/dashboard/add-item" className="text-blue-600 hover:underline">Add your first item</Link>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="p-2">
                            <DropdownMenuItem disabled={true}>
                              Edit
                            </DropdownMenuItem>
                            <DeleteButton itemId={item.id} />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </SidebarInset>
  );
}
