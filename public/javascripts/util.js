$(document).ready(function() {
    $('.alert').prop('hidden', true);
//    $('.body').bind('DOMSubtreeModified', function(e) {
//        if (e.target.innerHTML.length > 0) {
//            // Content change handler
////            $('.alert').prop('hidden', true);
//        }
//    });

//    $('#premium').click(function() {
//        if ($(this).is(':checked')) {
//            $('#premium-item-data').prop('hidden', false);
//            $('#name').prop('required', true);
//            $('#itemImg').prop('required', true);
//        } else {
//            $('#premium-item-data').prop('hidden', true);
//            $('#name').prop('required', false);
//            $('#itemImg').prop('required', false);
//        }
//    });
//
//    var changeSet = {};
//    $('input').change(function() {
//        var id = $(this).prop('id');
//        changeSet[id] = true;
//        $('#'+id+'Err').prop('hidden', true);
//        $(this).parent().parent().removeClass('has-danger');
//    });
//    $('#emoteImg').change(function() {
//        readURL(this, $('#emoteImgPreview'));
//    });
//    $('#itemImg').change(function() {
//        readURL(this, $('#itemImgPreview'));
//    });
//
//    $("#emoteForm").submit(function() {
//        $("#emoteForm>div.has-danger").removeClass("has-danger");
//        $("#emoteForm>small").prop('hidden', true);
//        uploadNow();
//
//        return false;
//    });
//
//    $(".cancelEmote").click(function(event) {
//        alert('clicked cancel');
//        // cancel default behavior
//        event.preventDefault();
//
//        $('.body').load('/1/emotes');
//        return false;
//    });
//
//    function readURL(input, target) {
//        if (input.files && input.files[0]) {
//            // var emoteFilename = input.files[0].name.replace(/.[\w]{3}$/, '');
//            var reader = new FileReader();
//            reader.onload = function (e) {
//                target.attr('src', e.target.result).prop('hidden', false);
//            }
//            reader.readAsDataURL(input.files[0]);
//        }
//    }
});


 // onclick="$('#body').load('/1/emotes')"
