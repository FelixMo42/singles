function nums(num, len) {
    return new Array(len).fill(num);
}

// extend Math

Math.randomInt = function(min, max) {
    if (max === undefined) {
        return Math.randomInt(0, min)
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// extend Array

Object.defineProperty(Array.prototype, 'shuffle', {
    value: function() {
        for (let i = this.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1)); // random index
            [this[i], this[j]] = [this[j], this[i]] // swap elements
        }

        return this
    }
})

Object.defineProperty(Array.prototype, 'random', {
    value: function() {
        return this[Math.floor(Math.random() * this.length)]
    }
})

Object.defineProperty(Array.prototype, 'onlyOne', {
    value: function(value) {
        let index = -1

        for (let i = 0; i < this.length; i++) {
            if (this[i] === value) {
                if (index === -1) {
                    index = i
                } else {
                    return -1
                }
            }
        }

        return index
    }
})

// extend URLSearchParams

Object.defineProperty(URLSearchParams.prototype, "getInt", {
    value: function(value) {
        if ( this.has(value) ) {
            return parseInt( this.get(value), 10 )
        } else {
            return
        }
    }
})