
$(document).ready(function () {
    // Use delegated event in case of dynamic content
    // $(document).on('click', '.has_sub > a', function (e) {
    //     e.preventDefault();

    //     var $parent = $(this).parent();
    //     var $submenu = $parent.find('> ul');

    //     // Close all other submenus
    //     $('.has_sub').not($parent).removeClass('nav-active').find('> ul').slideUp();

    //     // Toggle current submenu and active class
    //     $submenu.slideToggle();
    //     $parent.toggleClass('nav-active');
    // });

    // $('.button-menu-mobile').on('click', function () {
    //     $('body').toggleClass('mobile-menu-open');
    // });


});
    