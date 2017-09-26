module.exports = function(origin, data, error) {
    this.origin = origin || undefined;
    this.data = data || undefined;
    this.error = error || undefined;
};