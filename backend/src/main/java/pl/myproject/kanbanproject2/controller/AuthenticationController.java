package pl.myproject.kanbanproject2.controller;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import pl.myproject.kanbanproject2.model.User;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import pl.myproject.kanbanproject2.service.CustomUserDetailsService;

@Controller
@RequestMapping("register")
public class AuthenticationController {

    private final CustomUserDetailsService userDetailsService;


    public AuthenticationController(CustomUserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    @GetMapping()
    public String register(Model model){
        User user = new User();
        model.addAttribute("user", user);
        return "register";
    }
    @PostMapping()
    public String postUser(@ModelAttribute("user") User user,
                           Model model,
                           RedirectAttributes redirectAttributes){
        userDetailsService.registerUser(user);

        redirectAttributes.addFlashAttribute("message", "Confirm your email address");
        return "redirect:/";

    }
}
