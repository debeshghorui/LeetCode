-- Seed problems into public.problems.
-- Source of truth for editing: supabase/seed/problems.ts
-- Safe to re-run: skips titles that already exist.
--
-- Apply in Supabase SQL Editor (paste & run), or:
--   supabase db query --file supabase/seed.sql

insert into public.problems (
  title,
  description,
  difficulty,
  tags,
  constraints,
  hints,
  editorial,
  test_cases,
  examples,
  code_snippets,
  reference_solutions
)
select
  'Climbing Stairs',
  'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
  'EASY'::public.difficulty,
  array['Dynamic Programming', 'Math', 'Memoization'],
  '1 <= n <= 45',
  'To reach the nth step, you can either come from the (n-1)th step or the (n-2)th step.',
  'This is a classic dynamic programming problem. The number of ways to reach the nth step is the sum of the number of ways to reach the (n-1)th step and the (n-2)th step, forming a Fibonacci-like sequence.',
  $json$[{"input":"2","output":"2"},{"input":"3","output":"3"},{"input":"4","output":"5"}]$json$::jsonb,
  $json${"JAVASCRIPT":{"input":"n = 2","output":"2","explanation":"There are two ways to climb to the top:\n1. 1 step + 1 step\n2. 2 steps"},"PYTHON":{"input":"n = 3","output":"3","explanation":"There are three ways to climb to the top:\n1. 1 step + 1 step + 1 step\n2. 1 step + 2 steps\n3. 2 steps + 1 step"},"JAVA":{"input":"n = 4","output":"5","explanation":"There are five ways to climb to the top:\n1. 1 step + 1 step + 1 step + 1 step\n2. 1 step + 1 step + 2 steps\n3. 1 step + 2 steps + 1 step\n4. 2 steps + 1 step + 1 step\n5. 2 steps + 2 steps"}}$json$::jsonb,
  $json${"JAVASCRIPT":"/**\n* @param {number} n\n* @return {number}\n*/\nfunction climbStairs(n) {\n// Write your code here\n}\n\n// Parse input and execute\nconst readline = require('readline');\nconst rl = readline.createInterface({\ninput: process.stdin,\noutput: process.stdout,\nterminal: false\n});\n\nrl.on('line', (line) => {\nconst n = parseInt(line.trim());\nconst result = climbStairs(n);\n\nconsole.log(result);\nrl.close();\n});","PYTHON":"class Solution:\n  def climbStairs(self, n: int) -> int:\n      # Write your code here\n      pass\n\n# Input parsing\nif __name__ == \"__main__\":\n  import sys\n  \n  # Parse input\n  n = int(sys.stdin.readline().strip())\n  \n  # Solve\n  sol = Solution()\n  result = sol.climbStairs(n)\n  \n  # Print result\n  print(result)","JAVA":"import java.util.Scanner;\n\nclass Main {\n  public int climbStairs(int n) {\n      // Write your code here\n      return 0;\n  }\n  \n  public static void main(String[] args) {\n      Scanner scanner = new Scanner(System.in);\n      int n = Integer.parseInt(scanner.nextLine().trim());\n      \n      // Use Main class instead of Solution\n      Main main = new Main();\n      int result = main.climbStairs(n);\n      \n      System.out.println(result);\n      scanner.close();\n  }\n}"}$json$::jsonb,
  $json${"JAVASCRIPT":"/**\n* @param {number} n\n* @return {number}\n*/\nfunction climbStairs(n) {\n// Base cases\nif (n <= 2) {\n  return n;\n}\n\n// Dynamic programming approach\nlet dp = new Array(n + 1);\ndp[1] = 1;\ndp[2] = 2;\n\nfor (let i = 3; i <= n; i++) {\n  dp[i] = dp[i - 1] + dp[i - 2];\n}\n\nreturn dp[n];\n}","PYTHON":"class Solution:\n  def climbStairs(self, n: int) -> int:\n      # Base cases\n      if n <= 2:\n          return n\n      \n      # Dynamic programming approach\n      dp = [0] * (n + 1)\n      dp[1] = 1\n      dp[2] = 2\n      \n      for i in range(3, n + 1):\n          dp[i] = dp[i - 1] + dp[i - 2]\n      \n      return dp[n]","JAVA":"import java.util.Scanner;\n\nclass Main {\n  public int climbStairs(int n) {\n      // Base cases\n      if (n <= 2) {\n          return n;\n      }\n      \n      // Dynamic programming approach\n      int[] dp = new int[n + 1];\n      dp[1] = 1;\n      dp[2] = 2;\n      \n      for (int i = 3; i <= n; i++) {\n          dp[i] = dp[i - 1] + dp[i - 2];\n      }\n      \n      return dp[n];\n  }\n}"}$json$::jsonb
where not exists (
  select 1 from public.problems where title = 'Climbing Stairs'
);

insert into public.problems (
  title,
  description,
  difficulty,
  tags,
  constraints,
  hints,
  editorial,
  test_cases,
  examples,
  code_snippets,
  reference_solutions
)
select
  'Valid Palindrome',
  'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers. Given a string s, return true if it is a palindrome, or false otherwise.',
  'EASY'::public.difficulty,
  array['String', 'Two Pointers'],
  '1 <= s.length <= 2 * 10^5
s consists only of printable ASCII characters.',
  'Consider using two pointers, one from the start and one from the end, moving towards the center.',
  'We can use two pointers approach to check if the string is a palindrome. One pointer starts from the beginning and the other from the end, moving towards each other.',
  $json$[{"input":"A man, a plan, a canal: Panama","output":"true"},{"input":"race a car","output":"false"},{"input":" ","output":"true"}]$json$::jsonb,
  $json${"JAVASCRIPT":{"input":"s = \"A man, a plan, a canal: Panama\"","output":"true","explanation":"\"amanaplanacanalpanama\" is a palindrome."},"PYTHON":{"input":"s = \"A man, a plan, a canal: Panama\"","output":"true","explanation":"\"amanaplanacanalpanama\" is a palindrome."},"JAVA":{"input":"s = \"A man, a plan, a canal: Panama\"","output":"true","explanation":"\"amanaplanacanalpanama\" is a palindrome."}}$json$::jsonb,
  $json${"JAVASCRIPT":"/**\n   * @param {string} s\n   * @return {boolean}\n   */\n  function isPalindrome(s) {\n    // Write your code here\n  }\n  \n  // Add readline for dynamic input handling\n  const readline = require('readline');\n  const rl = readline.createInterface({\n    input: process.stdin,\n    output: process.stdout,\n    terminal: false\n  });\n  \n  // Process input line\n  rl.on('line', (line) => {\n    // Call solution with the input string\n    const result = isPalindrome(line);\n    \n    // Output the result\n    console.log(result ? \"true\" : \"false\");\n    rl.close();\n  });","PYTHON":"class Solution:\n      def isPalindrome(self, s: str) -> bool:\n          # Write your code here\n          pass\n  \n  # Input parsing\n  if __name__ == \"__main__\":\n      import sys\n      # Read the input string\n      s = sys.stdin.readline().strip()\n      \n      # Call solution\n      sol = Solution()\n      result = sol.isPalindrome(s)\n      \n      # Output result\n      print(str(result).lower())  # Convert True/False to lowercase true/false","JAVA":"import java.util.Scanner;\n\npublic class Main {\n    public static String preprocess(String s) {\n        return s.replaceAll(\"[^a-zA-Z0-9]\", \"\").toLowerCase();\n    }\n\n    public static boolean isPalindrome(String s) {\n       \n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String input = sc.nextLine();\n\n        boolean result = isPalindrome(input);\n        System.out.println(result ? \"true\" : \"false\");\n    }\n}\n"}$json$::jsonb,
  $json${"JAVASCRIPT":"/**\n   * @param {string} s\n   * @return {boolean}\n   */\n  function isPalindrome(s) {\n    // Convert to lowercase and remove non-alphanumeric characters\n    s = s.toLowerCase().replace(/[^a-z0-9]/g, '');\n    \n    // Check if it's a palindrome\n    let left = 0;\n    let right = s.length - 1;\n    \n    while (left < right) {\n      if (s[left] !== s[right]) {\n        return false;\n      }\n      left++;\n      right--;\n    }\n    \n    return true;\n  }\n  \n  // Add readline for dynamic input handling\n  const readline = require('readline');\n  const rl = readline.createInterface({\n    input: process.stdin,\n    output: process.stdout,\n    terminal: false\n  });\n  \n  // Process input line\n  rl.on('line', (line) => {\n    // Call solution with the input string\n    const result = isPalindrome(line);\n    \n    // Output the result\n    console.log(result ? \"true\" : \"false\");\n    rl.close();\n  });","PYTHON":"class Solution:\n      def isPalindrome(self, s: str) -> bool:\n          # Convert to lowercase and keep only alphanumeric characters\n          filtered_chars = [c.lower() for c in s if c.isalnum()]\n          \n          # Check if it's a palindrome\n          return filtered_chars == filtered_chars[::-1]\n  \n  # Input parsing\n  if __name__ == \"__main__\":\n      import sys\n      # Read the input string\n      s = sys.stdin.readline().strip()\n      \n      # Call solution\n      sol = Solution()\n      result = sol.isPalindrome(s)\n      \n      # Output result\n      print(str(result).lower())  # Convert True/False to lowercase true/false","JAVA":"import java.util.Scanner;\n\npublic class Main {\n    public static String preprocess(String s) {\n        return s.replaceAll(\"[^a-zA-Z0-9]\", \"\").toLowerCase();\n    }\n\n    public static boolean isPalindrome(String s) {\n        s = preprocess(s);\n        int left = 0, right = s.length() - 1;\n\n        while (left < right) {\n            if (s.charAt(left) != s.charAt(right)) return false;\n            left++;\n            right--;\n        }\n\n        return true;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String input = sc.nextLine();\n\n        boolean result = isPalindrome(input);\n        System.out.println(result ? \"true\" : \"false\");\n    }\n}\n"}$json$::jsonb
where not exists (
  select 1 from public.problems where title = 'Valid Palindrome'
);