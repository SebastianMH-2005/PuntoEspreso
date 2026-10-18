package com.puntoespresso.puntoespresso.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AdminController {

    @GetMapping("/admin")
    public String panel(Model model) {
        model.addAttribute("activePage", "admin");
        return "admin/panel";
    }
}