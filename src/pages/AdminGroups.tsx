import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Plus, Trash2, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface Group {
  id: string;
  name: string;
  created_at: string;
}

interface GroupMember {
  id: string;
  user_id: string;
  group_id: string;
  created_at: string;
  profile?: {
    name: string;
    user_id: string;
  };
  email?: string;
}

interface UserOption {
  id: string;
  email: string;
  name: string;
}

export default function AdminGroups() {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newGroupName, setNewGroupName] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Fetch all groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['admin-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Group[];
    },
    enabled: !!isAdmin,
  });

  // Fetch all group members with profiles
  const { data: groupMembers = [] } = useQuery({
    queryKey: ['admin-group-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          id,
          user_id,
          group_id,
          created_at,
          profile:profiles!group_members_user_id_fkey(name, user_id)
        `);
      
      if (error) throw error;
      
      // Fetch emails for all members
      const userIds = data?.map(m => m.user_id) || [];
      const uniqueUserIds = [...new Set(userIds)];
      
      // We'll get emails from profiles since we can't query auth.users directly
      const membersWithData = data?.map(member => ({
        ...member,
        profile: Array.isArray(member.profile) ? member.profile[0] : member.profile,
      })) || [];
      
      return membersWithData as GroupMember[];
    },
    enabled: !!isAdmin,
  });

  // Fetch all users with profiles (for adding to groups)
  const { data: allUsers = [] } = useQuery({
    queryKey: ['admin-all-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name');
      if (error) throw error;
      return data.map(p => ({
        id: p.user_id,
        name: p.name || 'Unknown',
        email: p.name, // We'll display name since we can't get email easily
      })) as UserOption[];
    },
    enabled: !!isAdmin,
  });

  // Create group mutation
  const createGroup = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from('groups')
        .insert({ name });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-groups'] });
      setNewGroupName('');
      setCreateDialogOpen(false);
      toast({ title: 'Group created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error creating group', description: error.message, variant: 'destructive' });
    },
  });

  // Delete group mutation
  const deleteGroup = useMutation({
    mutationFn: async (groupId: string) => {
      // First delete all members
      await supabase.from('group_members').delete().eq('group_id', groupId);
      // Then delete the group
      const { error } = await supabase.from('groups').delete().eq('id', groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-groups'] });
      queryClient.invalidateQueries({ queryKey: ['admin-group-members'] });
      toast({ title: 'Group deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error deleting group', description: error.message, variant: 'destructive' });
    },
  });

  // Add member mutation
  const addMember = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const { error } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-group-members'] });
      setAddMemberDialogOpen(false);
      setSelectedUserId('');
      toast({ title: 'Member added successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error adding member', description: error.message, variant: 'destructive' });
    },
  });

  // Remove member mutation
  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-group-members'] });
      toast({ title: 'Member removed successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error removing member', description: error.message, variant: 'destructive' });
    },
  });

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const getMembersForGroup = (groupId: string) => {
    return groupMembers.filter(m => m.group_id === groupId);
  };

  const getAvailableUsers = (groupId: string) => {
    const existingMemberIds = getMembersForGroup(groupId).map(m => m.user_id);
    return allUsers.filter(u => !existingMemberIds.includes(u.id));
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="heading-display text-foreground mb-2">Manage Groups</h1>
            <p className="text-body text-muted-foreground">
              Create groups and add members to enable collaboration
            </p>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>
                  Enter a name for the new accountability group.
                </DialogDescription>
              </DialogHeader>
              <Input
                placeholder="Group name (e.g., 'January 2026 Cohort')"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
              <DialogFooter>
                <Button
                  onClick={() => createGroup.mutate(newGroupName)}
                  disabled={!newGroupName.trim() || createGroup.isPending}
                >
                  {createGroup.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Group
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {groupsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : groups.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No groups yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first group to start adding members.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create First Group
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => {
              const members = getMembersForGroup(group.id);
              const availableUsers = getAvailableUsers(group.id);
              
              return (
                <Card key={group.id}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        {group.name}
                      </CardTitle>
                      <CardDescription>
                        {members.length} member{members.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog 
                        open={addMemberDialogOpen && selectedGroupId === group.id} 
                        onOpenChange={(open) => {
                          setAddMemberDialogOpen(open);
                          if (open) setSelectedGroupId(group.id);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            Add Member
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Member to {group.name}</DialogTitle>
                            <DialogDescription>
                              Select a user to add to this group.
                            </DialogDescription>
                          </DialogHeader>
                          {availableUsers.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                              All users are already in this group.
                            </p>
                          ) : (
                            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a user..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableUsers.map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <DialogFooter>
                            <Button
                              onClick={() => addMember.mutate({ groupId: group.id, userId: selectedUserId })}
                              disabled={!selectedUserId || addMember.isPending}
                            >
                              {addMember.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                              Add Member
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${group.name}"? This will remove all members.`)) {
                            deleteGroup.mutate(group.id);
                          }
                        }}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  {members.length > 0 && (
                    <CardContent>
                      <div className="space-y-2">
                        {members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          >
                            <span className="font-medium">
                              {member.profile?.name || 'Unknown User'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMember.mutate(member.id)}
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
