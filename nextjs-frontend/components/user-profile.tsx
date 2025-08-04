"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Calendar, Save, Key } from "lucide-react"

export function UserProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false)
      setIsEditing(false)
    }, 1000)
  }

  return (
    <div className="p-8 h-full overflow-auto bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold hf-text-gradient mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account information and preferences</p>
        </div>

        <div className="space-y-6">
          <Card className="hf-card">
            <CardHeader>
              <CardTitle className="text-foreground">Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback className="text-lg">JD</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">John Doe</h3>
                  <p className="text-muted-foreground">john.doe@example.com</p>
                  <Badge variant="secondary" className="mt-2">
                    <Calendar className="h-3 w-3 mr-1" />
                    Joined Jan 2024
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="firstName" defaultValue="John" className="pl-10" disabled={!isEditing} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="lastName" defaultValue="Doe" className="pl-10" disabled={!isEditing} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    defaultValue="john.doe@example.com"
                    className="pl-10"
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                ) : (
                  <>
                    <Button onClick={handleSave} disabled={isSaving}>
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="hf-card">
            <CardHeader>
              <CardTitle className="text-foreground">Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="currentPassword" type="password" placeholder="Enter current password" className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="newPassword" type="password" placeholder="Enter new password" className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="confirmPassword" type="password" placeholder="Confirm new password" className="pl-10" />
                </div>
              </div>
              <Button variant="outline">Update Password</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
