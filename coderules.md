# Code Rules

Strictly follow these rules when generating or editing code.

## DO NOT

1. **Do not commit code**  
   Never run `git commit`. Wait for explicit approval.

2. **Do not push code**  
   Never run or suggest `git push`.

3. **No backwards compatibility**  
   This is single-page, single-deployment code. Do not write compatibility layers.

4. **No fallbacks**  
   If something fails, let it fail hard. Do not add fallback logic.

5. **No defensive coding**  
   Avoid null-checks, existence checks, or structure validation. Let it crash.

6. **Never comment out deleted code**  
   Just delete it. Do not leave commented-out remnants or mention it.

7. **Avoid trivial comments**  
   Only add comments when essential. Do not describe obvious code like:

       // Update temperature display
       function updateTemperature()

8. **No try/catch wrappers**  
   Don't hide errors in `try/catch` unless absolutely necessary.

9. **No excessive logging**  
   Don't log routine or expected behavior. Only log critical issues.

10. **No auto-detection**  
    Be explicit. Do not infer or dynamically detect behavior or configuration.

11. **Do not copy files**  
    Move files instead. Git retains history.

12. **Do not create backups**  
    No `.bak`, `_old`, or `.copy` files. Use version control.

## ALWAYS

1. **Prefer small, focused changes**  
   Make small, incremental changes. Stop and let user test each step manually.

2. **Numbered taskslists**  
   every major work should be planned with a detailed, numbered tasklist.  Frequently refer to the tasklist — and always include the numbers.

3. **Fail fast and loudly**  
   Bugs should be visible immediately.

4. **Use direct function calls**  
   Avoid indirection unless absolutely necessary.

5. **Aggressively remove dead code**  
   If it isn't clearly used or tested, remove it.

6. **Consolidate duplicate functionality**  
   Only one implementation per concern.

7. **Use descriptive names over comments**  
   Name things clearly so comments aren't needed.

8. **Keep code concise and focused**  
   Avoid boilerplate, abstraction layers, or extra configuration.

9. **Prefer editing existing documentation**  
   When documenting, modify files in the `documentation/` directory rather than creating new ones.

10. **Keep documentation up to date**  
    Always update relevant docs when making code changes.