exports.sidebarMenuToggle = function (req, res) {
    if (!req.session)
        return res.status(204).send();

    if (!req.session.user.preferences)
        req.session.user.preferences = {};

    req.session.user.preferences.sidebarMenuExpand = 
        !req.session.user.preferences.sidebarMenuExpand;

    return res.status(204).send();
};