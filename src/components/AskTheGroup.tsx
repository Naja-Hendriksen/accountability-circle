import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useProfile } from '@/hooks/useProfile';
import { 
  useGroupQuestions, 
  useAddQuestion, 
  useAddAnswer,
  useDeleteQuestion,
  useDeleteAnswer,
  useToggleReaction,
  GroupQuestion,
  GroupAnswer
} from '@/hooks/useGroupQuestions';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Send, 
  Trash2, 
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquarePlus,
  Search,
  X,
  Heart
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface AskTheGroupProps {
  groupId: string;
}

export default function AskTheGroup({ groupId }: AskTheGroupProps) {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const { data: profile } = useProfile();
  const { data: questions = [], isLoading } = useGroupQuestions(groupId);
  const addQuestion = useAddQuestion();
  const { toast } = useToast();

  const [newQuestion, setNewQuestion] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const currentUserName = profile?.name || 'A member';

  // Filter questions based on search query
  const filteredQuestions = questions.filter(q => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchesContent = q.content.toLowerCase().includes(query);
    const matchesAuthor = q.profile?.name?.toLowerCase().includes(query);
    const matchesAnswers = q.answers?.some(a => 
      a.content.toLowerCase().includes(query) || 
      a.profile?.name?.toLowerCase().includes(query)
    );
    return matchesContent || matchesAuthor || matchesAnswers;
  });

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim()) return;

    try {
      await addQuestion.mutateAsync({ groupId, content: newQuestion });
      setNewQuestion('');
      toast({
        title: "Question posted!",
        description: "Your question is now visible to the group."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="card-elevated p-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <MessageCircle className="h-5 w-5 text-primary" />
        </div>
        <h2 className="heading-section">Ask The Group</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Ask questions, share insights, and get support from your accountability partners
      </p>

      {/* New Question Input */}
      <div className="mb-6">
        <div className="flex gap-3">
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="What's on your mind? Ask the group..."
            className="input-field flex-1 min-h-[80px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) {
                handleSubmitQuestion();
              }
            }}
          />
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-muted-foreground">⌘ + Enter to submit</span>
          <button
            onClick={handleSubmitQuestion}
            disabled={!newQuestion.trim() || addQuestion.isPending}
            className="btn-primary flex items-center gap-2"
          >
            {addQuestion.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Post Question
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {questions.length > 0 && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions, answers, or names..."
              className="input-field pl-10 pr-10 w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-muted-foreground mt-2">
              {filteredQuestions.length} {filteredQuestions.length === 1 ? 'result' : 'results'} for "{searchQuery}"
            </p>
          )}
        </div>
      )}

      {/* Questions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-border rounded-lg">
          <MessageSquarePlus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No questions yet. Be the first to ask!</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-border rounded-lg">
          <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No questions match your search.</p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-primary text-sm hover:underline mt-2"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              groupId={groupId}
              currentUserId={user?.id}
              currentUserName={currentUserName}
              isAdmin={isAdmin || false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface QuestionCardProps {
  question: GroupQuestion;
  groupId: string;
  currentUserId: string | undefined;
  currentUserName: string;
  isAdmin: boolean;
}

function QuestionCard({ question, groupId, currentUserId, currentUserName, isAdmin }: QuestionCardProps) {
  const [showAnswers, setShowAnswers] = useState(true);
  const [newAnswer, setNewAnswer] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  
  const addAnswer = useAddAnswer();
  const deleteQuestion = useDeleteQuestion();
  const deleteAnswer = useDeleteAnswer();
  const toggleReaction = useToggleReaction();
  const { toast } = useToast();

  const canDeleteQuestion = currentUserId === question.user_id || isAdmin;
  const answerCount = question.answers?.length || 0;

  const handleToggleLike = async (answerId?: string) => {
    try {
      if (answerId) {
        const answer = question.answers?.find(a => a.id === answerId);
        await toggleReaction.mutateAsync({
          answerId,
          groupId,
          hasLiked: answer?.userHasLiked || false
        });
      } else {
        await toggleReaction.mutateAsync({
          questionId: question.id,
          groupId,
          hasLiked: question.userHasLiked || false
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSubmitAnswer = async () => {
    if (!newAnswer.trim()) return;

    try {
      await addAnswer.mutateAsync({ 
        questionId: question.id, 
        content: newAnswer, 
        groupId,
        replierName: currentUserName
      });
      setNewAnswer('');
      setIsReplying(false);
      toast({
        title: "Reply posted!",
        description: "Your reply has been added."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteQuestion = async () => {
    try {
      await deleteQuestion.mutateAsync({ questionId: question.id, groupId });
      toast({
        title: "Question deleted",
        description: "The question and all replies have been removed."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteAnswer = async (answerId: string) => {
    try {
      await deleteAnswer.mutateAsync({ answerId, groupId });
      toast({
        title: "Reply deleted",
        description: "Your reply has been removed."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Question */}
      <div className="p-4 bg-card">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={question.profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-sage-light text-primary font-medium">
              {(question.profile?.name || '?')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-foreground">
                {question.profile?.name || 'Unknown'}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="mt-2 text-foreground whitespace-pre-wrap">{question.content}</p>
            
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => handleToggleLike()}
                disabled={toggleReaction.isPending}
                className={`text-sm flex items-center gap-1 transition-colors ${
                  question.userHasLiked 
                    ? 'text-accent' 
                    : 'text-muted-foreground hover:text-accent'
                }`}
              >
                <Heart className={`h-4 w-4 ${question.userHasLiked ? 'fill-current' : ''}`} />
                {(question.likeCount || 0) > 0 && <span>{question.likeCount}</span>}
              </button>

              <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <MessageCircle className="h-4 w-4" />
                Reply
              </button>
              
              {answerCount > 0 && (
                <button
                  onClick={() => setShowAnswers(!showAnswers)}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  {showAnswers ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {answerCount} {answerCount === 1 ? 'reply' : 'replies'}
                </button>
              )}
              
              {canDeleteQuestion && (
                <button
                  onClick={handleDeleteQuestion}
                  disabled={deleteQuestion.isPending}
                  className="text-sm text-muted-foreground hover:text-destructive flex items-center gap-1 ml-auto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reply input */}
        {isReplying && (
          <div className="mt-4 ml-12 animate-fade-in">
            <textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="Write your reply..."
              className="input-field w-full min-h-[60px] resize-none text-sm"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setIsReplying(false);
                  setNewAnswer('');
                }}
                className="btn-secondary text-sm py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAnswer}
                disabled={!newAnswer.trim() || addAnswer.isPending}
                className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1"
              >
                {addAnswer.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
                Reply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Answers */}
      {showAnswers && question.answers && question.answers.length > 0 && (
        <div className="border-t border-border bg-muted/30">
          {question.answers.map((answer) => {
            const canDeleteAnswer = currentUserId === answer.user_id || isAdmin;
            
            return (
              <div key={answer.id} className="p-4 border-b last:border-b-0 border-border/50">
                <div className="flex items-start gap-3 ml-6">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={answer.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-secondary text-muted-foreground text-sm">
                      {(answer.profile?.name || '?')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground">
                        {answer.profile?.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(answer.created_at), { addSuffix: true })}
                      </span>
                      {canDeleteAnswer && (
                        <button
                          onClick={() => handleDeleteAnswer(answer.id)}
                          disabled={deleteAnswer.isPending}
                          className="text-muted-foreground hover:text-destructive ml-auto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{answer.content}</p>
                    
                    {/* Like button for answer */}
                    <button
                      onClick={() => handleToggleLike(answer.id)}
                      disabled={toggleReaction.isPending}
                      className={`mt-2 text-xs flex items-center gap-1 transition-colors ${
                        answer.userHasLiked 
                          ? 'text-accent' 
                          : 'text-muted-foreground hover:text-accent'
                      }`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${answer.userHasLiked ? 'fill-current' : ''}`} />
                      {(answer.likeCount || 0) > 0 && <span>{answer.likeCount}</span>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
