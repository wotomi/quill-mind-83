import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { Code2, Chrome, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function Login() {
  const { signInWithGoogle, user, loading } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: error instanceof Error ? error.message : "Failed to sign in with Google",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Code2 className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to QuillMind</CardTitle>
          <CardDescription>
            Sign in to access your files and AI-powered editing tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleGoogleSignIn}
            className="w-full"
            size="lg"
          >
            <Chrome className="w-5 h-5 mr-2" />
            Continue with Google
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            By signing in, you agree to our terms of service and privacy policy.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}