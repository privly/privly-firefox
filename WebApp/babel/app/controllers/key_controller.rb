class KeyController < ApplicationController

  def index
    respond_to do |format|
      format.json {render :callback => params[:callback]}
      format.any {render :text => "Only JSON is currently supported"}
    end
  end


end
