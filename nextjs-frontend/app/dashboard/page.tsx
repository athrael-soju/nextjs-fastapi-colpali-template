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
import { FileText, Plus } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const items = (await fetchItems()) as ReadItemResponse;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Welcome to your Dashboard</h2>
      <p className="text-lg mb-6">
        Here, you can see the overview of your items and manage them.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Manage Items
            </CardTitle>
            <CardDescription>
              Add, view, and manage your items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/add-item">
              <Button variant="outline" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add New Item
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              ColPali Document Search
            </CardTitle>
            <CardDescription>
              Index and search PDF documents using AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/colpali">
              <Button variant="outline" className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Open ColPali
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <section className="p-6 bg-white rounded-lg shadow-lg mt-8">
        <h2 className="text-xl font-semibold mb-4">Items</h2>
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
                <TableCell colSpan={4} className="text-center">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="cursor-pointer p-1 text-gray-600 hover:text-gray-800">
                        <span className="text-lg font-semibold">...</span>
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
      </section>
    </div>
  );
}
